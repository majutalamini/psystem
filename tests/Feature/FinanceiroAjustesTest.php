<?php

namespace Tests\Feature;

use App\Actions\CriarCobranca;
use App\Models\Cobranca;
use App\Models\Despesa;
use App\Models\DespesaRecorrente;
use App\Models\Documento;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/** Hoje, nos testes, é segunda 28/09/2026. */
class FinanceiroAjustesTest extends ConsultorioTestCase
{
    private function cobranca(array $dados = []): Cobranca
    {
        return CriarCobranca::executar([
            'paciente_id' => $this->paciente()->id,
            'titulo' => 'Sessão avulsa',
            'valor' => 100,
            'vencimento' => '2026-10-05',
            ...$dados,
        ]);
    }

    private function conta(array $dados = []): array
    {
        return [
            'descricao' => 'Internet',
            'categoria' => 'Estrutura',
            'valor' => 120,
            'vencimento' => '15/10/2026',
            ...$dados,
        ];
    }

    // ---- Títulos a receber

    public function test_ajustar_o_vencimento_do_titulo_em_aberto(): void
    {
        $cobranca = $this->cobranca();

        $this->patch("/cobrancas/{$cobranca->id}", ['vencimento' => '20/10/2026'])->assertSessionHasNoErrors();

        $this->assertSame('2026-10-20', $cobranca->fresh()->vencimento->toDateString());
    }

    public function test_vencimento_invalido_ou_titulo_pago_nao_e_ajustado(): void
    {
        $cobranca = $this->cobranca();
        $this->patch("/cobrancas/{$cobranca->id}", ['vencimento' => '31/02/2026'])->assertSessionHasErrors('vencimento');

        $paga = $this->cobranca(['situacao' => 'pago']);
        $this->patch("/cobrancas/{$paga->id}", ['vencimento' => '20/10/2026'])->assertSessionHasErrors('vencimento');
        $this->assertSame('2026-10-05', $paga->fresh()->vencimento->toDateString());
    }

    public function test_cancelar_o_titulo_tira_ele_das_telas(): void
    {
        $cobranca = $this->cobranca();

        $this->delete("/cobrancas/{$cobranca->id}")->assertSessionHasNoErrors();

        $this->assertSame('cancelado', $cobranca->fresh()->situacao);
        $this->assertSame([], $this->get('/financeiro')->viewData('page')['props']['receivables']);
    }

    public function test_titulo_com_recebimento_nao_pode_ser_cancelado_sem_estornar(): void
    {
        $cobranca = $this->cobranca();
        $this->post("/cobrancas/{$cobranca->id}/pagamento", ['data' => '28/09/2026', 'valor' => 30, 'forma' => 'Pix']);

        $this->delete("/cobrancas/{$cobranca->id}")->assertSessionHasErrors('cobranca');
        $this->assertSame('pendente', $cobranca->fresh()->situacao);

        $pagamento = $cobranca->pagamentos()->sole();
        $this->post("/cobrancas/{$cobranca->id}/pagamentos/{$pagamento->id}/estorno", ['motivo' => 'Correção do teste'])->assertSessionHasNoErrors();
        $this->delete("/cobrancas/{$cobranca->id}")->assertSessionHasNoErrors();
        $this->assertSame('cancelado', $cobranca->fresh()->situacao);
    }

    public function test_mensalidade_cancelada_nao_volta_quando_o_comando_roda(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $mensalidade = Cobranca::sole();

        $this->delete("/cobrancas/{$mensalidade->id}");
        $this->travelTo(Carbon::parse('2026-10-05 01:10:00'));
        $this->artisan('mensalidades:gerar')->assertSuccessful();

        $this->assertSame(1, Cobranca::count());
        $this->assertSame('cancelado', Cobranca::sole()->situacao);
    }

    // ---- Contas a pagar

    public function test_editar_conta_a_pagar_em_aberto(): void
    {
        $this->post('/despesas', $this->conta());
        $despesa = Despesa::sole();

        $this->put("/despesas/{$despesa->id}", $this->conta(['descricao' => 'Internet fibra', 'valor' => 150, 'vencimento' => '20/10/2026']))
            ->assertSessionHasNoErrors();

        $despesa->refresh();
        $this->assertSame('Internet fibra', $despesa->descricao);
        $this->assertEquals(150, $despesa->valor);
        $this->assertSame('2026-10-20', $despesa->vencimento->toDateString());
    }

    public function test_conta_paga_nao_pode_ser_editada_nem_cancelada(): void
    {
        $this->post('/despesas', $this->conta());
        $despesa = Despesa::sole();
        $this->post("/despesas/{$despesa->id}/pagamento", ['data' => '28/09/2026', 'valor' => 120, 'forma' => 'Pix']);

        $this->put("/despesas/{$despesa->id}", $this->conta(['valor' => 999]))->assertSessionHasErrors('descricao');
        $this->delete("/despesas/{$despesa->id}")->assertSessionHasErrors('despesa');

        $this->assertEquals(120, $despesa->fresh()->valor);
        $this->assertNull($despesa->fresh()->cancelada_em);
    }

    public function test_cancelar_conta_a_pagar_tira_ela_das_telas_e_dos_totais(): void
    {
        $this->post('/despesas', $this->conta());
        $this->post('/despesas', $this->conta(['descricao' => 'Aluguel', 'valor' => 800]));
        $internet = Despesa::where('descricao', 'Internet')->sole();

        $this->delete("/despesas/{$internet->id}")->assertSessionHasNoErrors();

        $this->assertSame(['Aluguel'], collect($this->get('/financeiro')->viewData('page')['props']['payables'])->pluck('descricao')->all());
        $this->assertSame(1, Despesa::count());
        $this->assertSame(2, Despesa::withoutGlobalScopes()->count());
    }

    public function test_conta_recorrente_cria_o_modelo_e_a_primeira_conta(): void
    {
        $this->post('/despesas', $this->conta(['vencimento' => '15/10/2026', 'recorrente' => true]))->assertSessionHasNoErrors();

        $recorrencia = DespesaRecorrente::sole();
        $this->assertSame(15, $recorrencia->dia);
        $this->assertTrue($recorrencia->ativa);

        $despesa = Despesa::sole();
        $this->assertSame($recorrencia->id, $despesa->recorrente_id);
        $this->assertSame('2026-10-15', $despesa->vencimento->toDateString());
        $this->assertTrue($this->get('/financeiro')->viewData('page')['props']['payables'][0]['recorrente']);
    }

    public function test_comando_gera_a_conta_de_cada_mes_no_dia_sem_duplicar(): void
    {
        $this->post('/despesas', $this->conta(['vencimento' => '31/10/2026', 'recorrente' => true]));

        // No mês da primeira conta nada novo.
        $this->travelTo(Carbon::parse('2026-10-20 01:20:00'));
        $this->artisan('despesas:gerar')->assertSuccessful();
        $this->assertSame(1, Despesa::count());

        $this->travelTo(Carbon::parse('2026-11-01 01:20:00'));
        $this->artisan('despesas:gerar')->assertSuccessful();
        $this->artisan('despesas:gerar')->assertSuccessful();

        $this->travelTo(Carbon::parse('2026-12-01 01:20:00'));
        $this->artisan('despesas:gerar')->assertSuccessful();

        $this->assertSame(
            ['2026-10-31', '2026-11-30', '2026-12-31'],
            Despesa::orderBy('vencimento')->get()->map(fn ($d) => $d->vencimento->toDateString())->all(),
        );
    }

    public function test_recorrencia_encerrada_para_de_gerar_e_cancelada_nao_volta(): void
    {
        $this->post('/despesas', $this->conta(['vencimento' => '15/10/2026', 'recorrente' => true]));
        $primeira = Despesa::sole();

        $this->travelTo(Carbon::parse('2026-11-01 01:20:00'));
        $this->artisan('despesas:gerar');
        $novembro = Despesa::whereDate('competencia', '2026-11-01')->sole();

        // Cancelar só a de novembro: o comando não recria.
        $this->delete("/despesas/{$novembro->id}");
        $this->artisan('despesas:gerar');
        $this->assertSame(1, Despesa::count());

        // Encerrar a recorrência: dezembro não nasce.
        $this->delete("/despesas/{$primeira->id}/recorrencia")->assertSessionHasNoErrors();
        $this->travelTo(Carbon::parse('2026-12-01 01:20:00'));
        $this->artisan('despesas:gerar');
        $this->assertSame(1, Despesa::count());
    }

    public function test_editar_conta_recorrente_aplicando_aos_proximos_meses(): void
    {
        $this->post('/despesas', $this->conta(['vencimento' => '15/10/2026', 'recorrente' => true]));
        $despesa = Despesa::sole();

        $this->put("/despesas/{$despesa->id}", $this->conta(['valor' => 200, 'vencimento' => '10/10/2026', 'aplicarFuturos' => true]));

        $this->travelTo(Carbon::parse('2026-11-01 01:20:00'));
        $this->artisan('despesas:gerar');

        $nova = Despesa::whereDate('competencia', '2026-11-01')->sole();
        $this->assertEquals(200, $nova->valor);
        $this->assertSame('2026-11-10', $nova->vencimento->toDateString());
    }

    public function test_editar_so_esta_conta_nao_muda_as_proximas(): void
    {
        $this->post('/despesas', $this->conta(['vencimento' => '15/10/2026', 'recorrente' => true]));
        $despesa = Despesa::sole();

        $this->put("/despesas/{$despesa->id}", $this->conta(['valor' => 200, 'vencimento' => '10/10/2026']));

        $this->travelTo(Carbon::parse('2026-11-01 01:20:00'));
        $this->artisan('despesas:gerar');

        $nova = Despesa::whereDate('competencia', '2026-11-01')->sole();
        $this->assertEquals(120, $nova->valor);
        $this->assertSame('2026-11-15', $nova->vencimento->toDateString());
    }

    // ---- Documentos

    public function test_documento_abre_inline_e_baixa_so_com_o_parametro(): void
    {
        Storage::fake();
        $paciente = $this->paciente();
        $this->post("/pacientes/{$paciente->id}/documentos", [
            'title' => 'Laudo',
            'file' => UploadedFile::fake()->create('laudo.pdf', 20, 'application/pdf'),
        ])->assertSessionHasNoErrors();
        $documento = Documento::sole();

        $ver = $this->get("/documentos/{$documento->id}")->assertOk();
        $this->assertStringContainsString('inline', $ver->headers->get('Content-Disposition'));

        $baixar = $this->get("/documentos/{$documento->id}?baixar=1")->assertOk();
        $this->assertStringContainsString('attachment', $baixar->headers->get('Content-Disposition'));
    }
}
