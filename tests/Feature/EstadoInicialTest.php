<?php

namespace Tests\Feature;

use App\Actions\CriarCobranca;
use App\Actions\RegistrarPagamento;
use App\Models\Cobranca;
use App\Models\Configuracao;
use App\Models\Consulta;
use App\Models\Paciente;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/** Caracterização dos casos de uso antes da retirada dos defaults SQL. */
class EstadoInicialTest extends ConsultorioTestCase
{
    public function test_cadastro_http_comeca_inativo_e_matricula_ativa_o_paciente(): void
    {
        $this->post('/pacientes', [
            'name' => 'Estado Inicial', 'cpf' => '52998224725',
            'phone' => '(48) 99999-0000', 'nascimento' => '01/01/1990',
        ])->assertSessionHasNoErrors();
        $paciente = Paciente::sole();
        $this->assertSame('inativo', $paciente->status_paciente);

        $this->matricular($paciente, weekday: 2)->assertSessionHasNoErrors();
        $this->assertSame('ativa', $paciente->matriculas()->sole()->status_matricula);
        $this->assertSame('ativo', $paciente->fresh()->status_paciente);
        $this->assertSame(['agendado'], $paciente->consultas()->distinct()->pluck('status')->all());
        $this->assertSame([50], $paciente->consultas()->distinct()->pluck('duracao_minutos')->all());
        $this->assertSame(9, $paciente->consultas()->count());
    }

    public function test_consulta_avulsa_nasce_agendada_com_a_duracao_configurada(): void
    {
        Configuracao::atual()->update(['duracao_sessao' => 30]);
        $this->post('/agenda', [
            'patientId' => $this->paciente()->id, 'date' => '2026-09-30',
            'hora' => '08:00', 'tipo' => 'Consulta online', 'status' => 'Pendente', 'valor' => 0,
        ])->assertSessionHasNoErrors();
        $consulta = Consulta::sole();
        $this->assertSame('agendado', $consulta->status);
        $this->assertSame(30, $consulta->duracao_minutos);
        $this->assertNull($consulta->matricula_id);
        $this->assertSame('online', $consulta->modalidade);
    }

    public function test_cobranca_manual_comeca_pendente_e_baixa_preserva_a_data_informada(): void
    {
        $this->post('/cobrancas', [
            'patientId' => $this->paciente()->id, 'referencia' => 'Caracterização',
            'valor' => 200, 'vencimento' => '30/09/2026',
        ])->assertSessionHasNoErrors();
        $cobranca = Cobranca::sole();
        $this->assertSame('pendente', $cobranca->situacao);
        $this->assertSame(200.0, $cobranca->saldo());

        $this->post("/cobrancas/{$cobranca->id}/pagamento", [
            'data' => '27/09/2026', 'valor' => 80, 'forma' => 'Pix',
        ])->assertSessionHasNoErrors();
        $pagamento = $cobranca->pagamentos()->sole();
        $this->assertSame('2026-09-27', $pagamento->data_pagamento->toDateString());
        $this->assertSame('pix', $pagamento->metodo_pagamento);
        $this->assertSame('pendente', $cobranca->fresh()->situacao);
        $this->assertSame(120.0, $cobranca->fresh()->saldo());

        $this->post("/cobrancas/{$cobranca->id}/pagamentos/{$pagamento->id}/estorno", ['motivo' => 'Teste'])->assertSessionHasNoErrors();
        $this->assertSame(0, $cobranca->pagamentos()->validos()->count());
        $this->assertSame(200.0, $cobranca->fresh()->saldo());
    }

    public function test_instalacao_sem_configuracao_tem_expediente_padrao_e_metas_zero(): void
    {
        Configuracao::query()->delete();
        $config = Configuracao::atual()->fresh();
        $this->assertSame(['Seg', 'Ter', 'Qua', 'Qui', 'Sex'], $config->dias_atendimento);
        $this->assertSame('08:00', substr($config->expediente_inicio, 0, 5));
        $this->assertSame('18:00', substr($config->expediente_fim, 0, 5));
        $this->assertSame(50, $config->duracao_sessao);
        $this->assertSame(0, $config->intervalo_sessao);
        $this->assertSame(['faturamentoMensal' => 0.0, 'horasSemanais' => 0, 'sessoesSemanais' => 0, 'novosPacientesMes' => 0], $config->metas());
        $this->assertNull($config->almoco_inicio);
        $this->assertNull($config->almoco_fim);
    }

    public function test_pagamento_sem_data_usa_o_momento_atual_e_data_explicita_e_preservada(): void
    {
        // O relógio do banco não segue travelTo(): compare o fallback real antes
        // da extração e o relógio PHP real depois, sem trocar a data financeira HTTP.
        $this->travelBack();
        $momento = Carbon::parse(DB::selectOne('select current_timestamp as momento')->momento);
        $cobranca = CriarCobranca::executar([
            'paciente_id' => $this->paciente()->id, 'titulo' => 'Data do pagamento',
            'valor' => 100, 'vencimento' => today(), 'situacao' => 'pendente',
        ]);
        $semData = RegistrarPagamento::executar([
            'cobranca_id' => $cobranca->id, 'valor_pago' => 1, 'metodo_pagamento' => 'pix'])->fresh();
        $this->assertLessThanOrEqual(5, abs($semData->data_pagamento->getTimestamp() - $momento->getTimestamp()));
        $data = Carbon::parse('2026-09-27 11:23:00', 'America/Sao_Paulo');
        $explicito = RegistrarPagamento::executar([
            'cobranca_id' => $cobranca->id, 'valor_pago' => 1, 'metodo_pagamento' => 'pix', 'data_pagamento' => $data])->fresh();
        $this->assertTrue($explicito->data_pagamento->equalTo($data));
        $this->assertSame('pendente', $cobranca->fresh()->situacao);
    }

    public function test_com_limite_1_um_horario_ocupado_bloqueia_outro_paciente_e_cancelamento_o_libera(): void
    {
        $this->limitar(1);
        $primeiro = $this->paciente();
        $segundo = $this->paciente();
        $form = ['date' => '2026-09-30', 'hora' => '08:50', 'tipo' => 'Consulta presencial', 'status' => 'Pendente', 'valor' => 0];
        $this->post('/agenda', [...$form, 'patientId' => $primeiro->id])->assertSessionHasNoErrors();
        $this->post('/agenda', [...$form, 'patientId' => $segundo->id])
            ->assertSessionHasErrors(['hora' => 'Esse horário já tem consulta marcada.']);
        $consulta = Consulta::sole();
        $this->patch("/agenda/{$consulta->id}/status", ['status' => 'cancelado'])->assertSessionHasNoErrors();
        $this->post('/agenda', [...$form, 'patientId' => $segundo->id])->assertSessionHasNoErrors();
        $this->assertSame(2, Consulta::count());
        $this->assertSame([$segundo->id], Consulta::where('status', '!=', 'cancelado')->pluck('paciente_id')->all());
    }
}
