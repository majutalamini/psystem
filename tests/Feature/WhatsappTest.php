<?php

namespace Tests\Feature;

use App\Models\Cobranca;
use App\Models\Configuracao;
use App\Models\Consulta;
use App\Models\MensagemWhatsapp;
use App\Services\AvisosWhatsapp;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;

/** Agora é segunda, 28/09/2026 às 10:00. */
class WhatsappTest extends ConsultorioTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Sleep::fake();
        Http::preventStrayRequests();
        Configuracao::atual()->update([
            'whatsapp_ativo' => true,
            'whatsapp_dias_antes' => 2,
            'mensagem_lembrete' => 'Olá {paciente}! Sua sessão é em {data} às {hora}.',
            'mensagem_cobranca' => 'Olá {paciente}, a cobrança {referencia} de {valor} vence em {vencimento}.',
        ]);
    }

    private function consultaAmanha(array $paciente = [], string $hora = '15:00'): Consulta
    {
        return Consulta::create([
            'paciente_id' => $this->paciente(['nome' => 'Maria Souza', 'telefone' => '(48) 99999-0000', 'aceita_whatsapp' => true, ...$paciente])->id,
            'data_hora_consulta' => Carbon::parse("2026-09-29 {$hora}"),
            'modalidade' => 'presencial',
        ]);
    }

    private function modoTwilio(): void
    {
        config([
            'services.whatsapp.modo' => 'twilio',
            'services.twilio.account_sid' => 'AC123',
            'services.twilio.auth_token' => 'segredo',
        ]);
    }

    public function test_modo_teste_registra_o_lembrete_de_amanha_sem_enviar(): void
    {
        $consulta = $this->consultaAmanha();

        $this->artisan('whatsapp:lembretes')->assertSuccessful();
        $this->artisan('whatsapp:lembretes'); // não repete

        $mensagem = MensagemWhatsapp::sole();
        $this->assertSame('simulada', $mensagem->situacao);
        $this->assertSame('lembrete', $mensagem->tipo);
        $this->assertSame($consulta->id, $mensagem->agenda_id);
        $this->assertSame('+5548999990000', $mensagem->telefone);
        $this->assertSame('Olá Maria! Sua sessão é em 29/09/2026 às 15:00.', $mensagem->texto);
    }

    public function test_so_recebe_paciente_ativo_que_aceitou_e_com_envio_ligado(): void
    {
        $this->consultaAmanha(['aceita_whatsapp' => false]);
        $this->consultaAmanha(['status_paciente' => 'inativo'], '16:00');
        $this->artisan('whatsapp:lembretes');
        $this->assertSame(0, MensagemWhatsapp::count());

        Consulta::query()->delete();
        $this->consultaAmanha([], '17:00');
        Configuracao::atual()->update(['whatsapp_ativo' => false]);
        $this->artisan('whatsapp:lembretes');
        $this->assertSame(0, MensagemWhatsapp::count());
    }

    public function test_cobranca_que_vence_daqui_a_dias_antes_vai_com_o_valor_que_falta(): void
    {
        $paciente = $this->paciente(['nome' => 'Maria Souza', 'aceita_whatsapp' => true]);
        $cobranca = Cobranca::create(['paciente_id' => $paciente->id, 'titulo' => 'Sessão avulsa', 'valor' => 200, 'vencimento' => '2026-09-30']);
        $cobranca->pagamentos()->create(['valor_pago' => 50, 'metodo_pagamento' => 'pix', 'data_pagamento' => '2026-09-28']);
        Cobranca::create(['paciente_id' => $paciente->id, 'titulo' => 'Outra', 'valor' => 200, 'vencimento' => '2026-10-01']);

        $this->artisan('whatsapp:cobrancas')->assertSuccessful();

        $mensagem = MensagemWhatsapp::sole();
        $this->assertSame($cobranca->id, $mensagem->cobranca_id);
        $this->assertSame('Olá Maria, a cobrança Sessão avulsa de R$ 150,00 vence em 30/09/2026.', $mensagem->texto);
    }

    public function test_modo_twilio_envia_pela_api(): void
    {
        $this->modoTwilio();
        Http::fake(['api.twilio.com/*' => Http::response(['sid' => 'SM123', 'status' => 'queued', 'error_code' => null], 201)]);
        $this->consultaAmanha();

        $this->artisan('whatsapp:lembretes');

        Http::assertSent(fn (Request $r) => $r->url() === 'https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json'
            && $r['From'] === 'whatsapp:+14155238886'
            && $r['To'] === 'whatsapp:+5548999990000'
            && $r['Body'] === 'Olá Maria! Sua sessão é em 29/09/2026 às 15:00.'
            && $r->hasHeader('Authorization', 'Basic '.base64_encode('AC123:segredo')));
        $mensagem = MensagemWhatsapp::sole();
        $this->assertSame('enviada', $mensagem->situacao);
        $this->assertSame('SM123', $mensagem->id_externo);
    }

    public function test_modo_twilio_com_modelo_aprovado_manda_content_sid(): void
    {
        $this->modoTwilio();
        config(['services.twilio.content_sid_lembrete' => 'HXabc']);
        Http::fake(['api.twilio.com/*' => Http::response(['sid' => 'SM1'], 201)]);
        $this->consultaAmanha();

        $this->artisan('whatsapp:lembretes');

        Http::assertSent(fn (Request $r) => $r['ContentSid'] === 'HXabc'
            && $r['ContentVariables'] === '{"1":"29/09","2":"15:00"}'
            && ! isset($r['Body']));
    }

    public function test_erro_da_twilio_fica_registrado_e_pode_ser_tentado_de_novo(): void
    {
        $this->modoTwilio();
        Http::fakeSequence('api.twilio.com/*')
            ->push(['code' => 63015, 'message' => 'Channel Sandbox can only send messages to phone numbers that have joined the Sandbox', 'status' => 400], 400)
            ->push(['sid' => 'SM2'], 201);
        $this->consultaAmanha();

        $this->artisan('whatsapp:lembretes');
        $this->assertSame('erro', MensagemWhatsapp::sole()->situacao);
        $this->assertStringContainsString('Erro 63015', MensagemWhatsapp::sole()->erro);
        $this->assertStringContainsString('mande "join <código>"', MensagemWhatsapp::sole()->erro);

        $this->artisan('whatsapp:lembretes');
        $this->assertSame(['erro', 'enviada'], MensagemWhatsapp::orderBy('id')->pluck('situacao')->all());
    }

    public function test_sandbox_espera_3_segundos_entre_mensagens(): void
    {
        $this->modoTwilio();
        Http::fake(['api.twilio.com/*' => Http::response(['sid' => 'SM1'], 201)]);
        $this->consultaAmanha();
        Consulta::create([
            'paciente_id' => $this->paciente(['aceita_whatsapp' => true])->id,
            'data_hora_consulta' => Carbon::parse('2026-09-29 16:00'),
            'modalidade' => 'online',
        ]);

        $this->artisan('whatsapp:lembretes');

        Http::assertSentCount(2);
        Sleep::assertSleptTimes(1);
    }

    public function test_botao_de_teste_nas_configuracoes(): void
    {
        $this->from('/configuracoes')->post('/configuracoes/whatsapp/teste', ['telefone' => '48 99999-0000'])
            ->assertRedirect('/configuracoes')
            ->assertSessionHas('aviso_whatsapp');
        $this->assertSame('simulada', MensagemWhatsapp::sole()->situacao);

        // Twilio sem credenciais: o erro volta para a tela.
        config(['services.whatsapp.modo' => 'twilio']);
        $this->post('/configuracoes/whatsapp/teste', ['telefone' => '48 99999-0000'])->assertSessionHasErrors('telefone');
    }

    public function test_botao_de_teste_usa_o_modelo_quando_configurado(): void
    {
        $this->modoTwilio();
        config(['services.twilio.content_sid_lembrete' => 'HXb5b62575e6e4ff6129ad7c8efe1f983e']);
        Http::fake(['api.twilio.com/*' => Http::response(['sid' => 'SM9'], 201)]);

        $this->post('/configuracoes/whatsapp/teste', ['telefone' => '(48) 98836-4746'])->assertSessionHasNoErrors();

        Http::assertSent(fn (Request $r) => $r['ContentSid'] === 'HXb5b62575e6e4ff6129ad7c8efe1f983e'
            && $r['ContentVariables'] === '{"1":"28/09","2":"11:00"}'
            && $r['To'] === 'whatsapp:+5548988364746');
        $this->assertSame('enviada', MensagemWhatsapp::sole()->situacao);
    }

    private function modoEvolution(): void
    {
        config(['services.whatsapp.modo' => 'evolution']);
    }

    public function test_modo_evolution_envia_texto_livre_com_o_celular_conectado(): void
    {
        $this->modoEvolution();
        Http::fake([
            'evolution.teste/instance/connectionState/psystem' => Http::response(['instance' => ['instanceName' => 'psystem', 'state' => 'open']]),
            'evolution.teste/message/sendText/psystem' => Http::response(['key' => ['id' => '3EB0ABC', 'fromMe' => true], 'status' => 'PENDING'], 201),
        ]);
        $this->consultaAmanha();

        $this->artisan('whatsapp:lembretes');

        Http::assertSent(fn (Request $r) => $r->url() === 'http://evolution.teste/message/sendText/psystem'
            && $r->hasHeader('apikey', 'chave-de-teste')
            && $r['number'] === '5548999990000'
            && $r['text'] === 'Olá Maria! Sua sessão é em 29/09/2026 às 15:00.');
        $mensagem = MensagemWhatsapp::sole();
        $this->assertSame('enviada', $mensagem->situacao);
        $this->assertSame('3EB0ABC', $mensagem->id_externo);
    }

    public function test_modo_evolution_sem_celular_conectado_avisa_sem_tentar_enviar(): void
    {
        $this->modoEvolution();
        Http::fake(['evolution.teste/instance/connectionState/psystem' => Http::response(['instance' => ['state' => 'connecting']])]);
        $this->consultaAmanha();

        $this->artisan('whatsapp:lembretes');

        Http::assertNotSent(fn (Request $r) => str_contains($r->url(), 'sendText'));
        $this->assertStringContainsString('escaneie o QR code', MensagemWhatsapp::sole()->erro);
    }

    public function test_modo_evolution_numero_sem_whatsapp(): void
    {
        $this->modoEvolution();
        Http::fake([
            'evolution.teste/instance/connectionState/psystem' => Http::response(['instance' => ['state' => 'open']]),
            'evolution.teste/message/sendText/psystem' => Http::response(['status' => 400, 'error' => 'Bad Request', 'response' => ['message' => [['exists' => false, 'jid' => '5548999990000@s.whatsapp.net', 'number' => '5548999990000']]]], 400),
        ]);

        $this->post('/configuracoes/whatsapp/teste', ['telefone' => '(48) 99999-0000'])
            ->assertSessionHasErrors(['telefone' => 'Erro 400 da Evolution: O número 5548999990000 não tem WhatsApp.']);
    }

    public function test_conexao_cria_a_instancia_e_mostra_o_qr_code(): void
    {
        $this->modoEvolution();
        Http::fake([
            'evolution.teste/instance/connectionState/psystem' => Http::response(['status' => 404, 'response' => ['message' => ['The "psystem" instance does not exist']]], 404),
            'evolution.teste/instance/create' => Http::response(['instance' => ['status' => 'connecting'], 'qrcode' => ['base64' => 'data:image/png;base64,QR']], 201),
        ]);

        $conexao = app(\App\Services\WhatsApp\EvolutionApi::class)->conexao();

        $this->assertSame(['estado' => 'connecting', 'qr' => 'data:image/png;base64,QR', 'erro' => null], $conexao);
        Http::assertSent(fn (Request $r) => $r->url() === 'http://evolution.teste/instance/create'
            && $r['instanceName'] === 'psystem' && $r['integration'] === 'WHATSAPP-BAILEYS');
    }

    public function test_desconectar_o_celular(): void
    {
        $this->modoEvolution();
        Http::fake(['evolution.teste/instance/logout/psystem' => Http::response(['status' => 'SUCCESS'])]);

        $this->post('/configuracoes/whatsapp/desconectar')->assertSessionHas('aviso_whatsapp');

        Http::assertSent(fn (Request $r) => $r->method() === 'DELETE' && $r->url() === 'http://evolution.teste/instance/logout/psystem');
    }

    public function test_mensagem_manual_do_atalho_em_modo_teste_fica_registrada(): void
    {
        $paciente = $this->paciente(['nome' => 'Maria Souza', 'telefone' => '(48) 99999-0000']);

        $this->from('/pacientes')->post('/whatsapp/enviar', ['patientId' => $paciente->id, 'tipo' => 'livre', 'texto' => 'Oi, Maria!'])
            ->assertRedirect('/pacientes')
            ->assertSessionHas('aviso_whatsapp', 'Mensagem registrada (modo teste: nada foi enviado).');

        $mensagem = MensagemWhatsapp::sole();
        $this->assertSame(['livre', 'simulada', 'Oi, Maria!', $paciente->id], [$mensagem->tipo, $mensagem->situacao, $mensagem->texto, $mensagem->paciente_id]);
    }

    public function test_mensagem_manual_sai_pela_evolution_mesmo_com_envio_automatico_desligado(): void
    {
        $this->modoEvolution();
        Configuracao::atual()->update(['whatsapp_ativo' => false]);
        Http::fake([
            'evolution.teste/instance/connectionState/psystem' => Http::response(['instance' => ['state' => 'open']]),
            'evolution.teste/message/sendText/psystem' => Http::response(['key' => ['id' => 'ABC']], 201),
        ]);
        $paciente = $this->paciente(['telefone' => '(48) 98836-4746']);

        $this->post('/whatsapp/enviar', ['patientId' => $paciente->id, 'tipo' => 'cobranca', 'texto' => 'Cobrança'])
            ->assertSessionHas('aviso_whatsapp', 'Mensagem enviada pelo WhatsApp.');

        Http::assertSent(fn (Request $r) => str_contains($r->url(), 'sendText') && $r['number'] === '5548988364746' && $r['text'] === 'Cobrança');
        $this->assertSame('enviada', MensagemWhatsapp::sole()->situacao);
    }

    public function test_mensagem_manual_com_erro_volta_para_o_modal(): void
    {
        $this->modoEvolution();
        Http::fake(['evolution.teste/instance/connectionState/psystem' => Http::response(['instance' => ['state' => 'close']])]);

        $this->post('/whatsapp/enviar', ['patientId' => $this->paciente()->id, 'tipo' => 'livre', 'texto' => 'Oi'])
            ->assertSessionHasErrors(['texto' => 'WhatsApp não conectado: escaneie o QR code em Configurações › WhatsApp.']);
    }

    public function test_telefone_em_formato_internacional(): void
    {
        $this->assertSame('+5548999990000', AvisosWhatsapp::telefoneE164('(48) 99999-0000'));
        $this->assertSame('+5548999990000', AvisosWhatsapp::telefoneE164('+55 48 99999-0000'));
        $this->assertNull(AvisosWhatsapp::telefoneE164(''));
    }

    public function test_consentimento_no_cadastro_do_paciente(): void
    {
        $this->post('/pacientes', [
            'name' => 'Nova Paciente', 'cpf' => '123.456.789-09', 'nascimento' => '01/02/1990',
            'phone' => '(48) 98888-0000', 'status' => 'Ativo', 'aceitaWhatsapp' => true,
        ])->assertSessionHasNoErrors();

        $this->assertTrue(\App\Models\Paciente::where('nome', 'Nova Paciente')->sole()->aceita_whatsapp);
    }
}
