<?php

namespace Tests\Feature;

use App\Models\Cobranca;
use App\Models\Contrato;
use Illuminate\Support\Carbon;

/**
 * Contrato = pacote de sessões que renova sozinho, gera uma mensalidade por pacote e é bloqueado por inadimplência.
 * Hoje, nos testes, é segunda 28/09/2026 às 10:00 (atendimento de segunda a sexta, sessões de 50 min desde as 08:00).
 */
class ContratoTest extends ConsultorioTestCase
{
    private const QUARTA = ['weekday' => 2, 'time' => '08:50', 'tipo' => 'Consulta presencial'];

    private const SEGUNDA = ['weekday' => 0, 'time' => '13:50', 'tipo' => 'Consulta presencial'];

    public function test_criar_contrato_gera_agenda_mensalidade_do_pacote_e_ativa_o_paciente(): void
    {
        $paciente = $this->paciente(['status_paciente' => 'inativo']);

        $this->contratar($paciente, [self::QUARTA], valor: 640, sessoes: 4)->assertSessionHasNoErrors();

        $contrato = Contrato::sole();
        $this->assertSame('ativo', $contrato->status);
        $this->assertSame(1, $contrato->ciclo_atual);
        $this->assertSame('2026-09-28', $contrato->ciclo_inicio->toDateString());
        $this->assertSame('2026-10-21', $contrato->ciclo_fim->toDateString(), '4 quartas: 30/09, 07/10, 14/10 e 21/10');
        $this->assertSame('ativo', $paciente->fresh()->status_paciente);
        $this->assertCount(9, $this->horarios($paciente), 'a agenda continua abrindo 2 meses: o contrato renova sozinho');

        $cobranca = Cobranca::sole();
        $this->assertSame('Mensalidade — pacote 1 (4 sessões)', $cobranca->titulo);
        $this->assertEquals(640, $cobranca->valor);
        $this->assertSame('2026-09-28', $cobranca->vencimento->toDateString());
        $this->assertSame([$contrato->id, 1], [$cobranca->contrato_id, $cobranca->ciclo]);

        $props = $this->get("/pacientes/{$paciente->id}")->assertOk()->viewData('page')['props'];
        $this->assertSame(4, $props['contracts'][0]['sessoes']);
        $this->assertSame('21/10/2026', $props['contracts'][0]['cicloFim']);
        $this->assertSame(['Mensalidade — pacote 1 (4 sessões)'], collect($props['receivables'])->pluck('referencia')->all());
    }

    public function test_contrato_exige_ao_menos_um_dia_e_horario(): void
    {
        $paciente = $this->paciente();

        $this->contratar($paciente, [])->assertSessionHasErrors('horarios');
        $this->assertSame(0, Contrato::count());
        $this->assertSame(0, Cobranca::count());
    }

    public function test_varios_dias_na_semana_encurtam_o_pacote(): void
    {
        $paciente = $this->paciente();

        $this->contratar($paciente, [self::SEGUNDA, self::QUARTA], sessoes: 8, inicio: '29/09/2026')->assertSessionHasNoErrors();

        // 30/09, 05/10, 07/10, 12/10, 14/10, 19/10, 21/10 e 26/10.
        $this->assertSame('2026-10-26', Contrato::sole()->ciclo_fim->toDateString());
        $this->assertSame('2026-09-29', Cobranca::sole()->vencimento->toDateString());
    }

    public function test_paciente_so_pode_ter_um_contrato_em_vigor(): void
    {
        $paciente = $this->paciente();
        $this->contratar($paciente, [self::QUARTA]);

        $this->contratar($paciente, [self::SEGUNDA])->assertSessionHasErrors('sessoes');
        $this->assertSame(1, Contrato::count());
    }

    public function test_pacote_renova_sozinho_e_lanca_a_proxima_mensalidade(): void
    {
        $paciente = $this->paciente();
        $this->contratar($paciente, [self::QUARTA], valor: 640);
        $this->pagar(Cobranca::sole());

        $this->travelTo(Carbon::parse('2026-10-21 00:30:00'));
        $this->artisan('contratos:processar')->assertSuccessful();
        $this->assertSame(1, Contrato::sole()->ciclo_atual, 'no último dia do pacote ainda não renova');

        $this->travelTo(Carbon::parse('2026-10-22 00:30:00'));
        $this->artisan('contratos:processar')->assertSuccessful();
        $this->artisan('contratos:processar')->assertSuccessful();

        $contrato = Contrato::sole();
        $this->assertSame(2, $contrato->ciclo_atual);
        $this->assertSame('2026-10-22', $contrato->ciclo_inicio->toDateString());
        $this->assertSame('2026-11-18', $contrato->ciclo_fim->toDateString());

        $nova = Cobranca::where('ciclo', 2)->sole();
        $this->assertSame('Mensalidade — pacote 2 (4 sessões)', $nova->titulo);
        $this->assertSame('2026-10-22', $nova->vencimento->toDateString());
        $this->assertSame(2, Cobranca::count(), 'não duplica');
        $this->assertSame('ativo', $paciente->fresh()->status_paciente);
    }

    public function test_titulo_vencido_bloqueia_o_contrato_e_tira_a_agenda_e_quitar_desbloqueia(): void
    {
        $paciente = $this->paciente();
        $this->contratar($paciente, [self::QUARTA]);
        $this->assertCount(9, $this->horarios($paciente));

        // A mensalidade venceu ontem.
        $this->travelTo(Carbon::parse('2026-09-29 00:30:00'));
        $this->artisan('contratos:processar')->assertSuccessful();

        $this->assertSame('bloqueado', Contrato::sole()->status);
        $this->assertSame('bloqueado', $paciente->fresh()->status_paciente);
        $this->assertSame([], $this->horarios($paciente), 'as sessões futuras saem da agenda');
        $tela = $this->get('/pacientes')->viewData('page')['props']['patients'];
        $this->assertSame('Bloqueado', collect($tela)->firstWhere('id', $paciente->id)['status']);

        // Quitar o título libera o contrato e refaz a agenda.
        $this->pagar(Cobranca::sole())->assertSessionHas('aviso');

        $this->assertSame('ativo', Contrato::sole()->status);
        $this->assertSame('ativo', $paciente->fresh()->status_paciente);
        $this->assertCount(9, $this->horarios($paciente));
    }

    public function test_contrato_bloqueado_nao_renova_e_ao_quitar_comeca_pacote_novo_hoje(): void
    {
        $paciente = $this->paciente();
        $this->contratar($paciente, [self::QUARTA]);

        $this->travelTo(Carbon::parse('2026-10-26 00:30:00'));
        $this->artisan('contratos:processar')->assertSuccessful();
        $this->assertSame('bloqueado', Contrato::sole()->status);
        $this->assertSame(1, Contrato::sole()->ciclo_atual, 'bloqueado não renova');

        $this->travelTo(Carbon::parse('2026-10-26 10:00:00'));
        $this->pagar(Cobranca::sole());

        $contrato = Contrato::sole();
        $this->assertSame('ativo', $contrato->status);
        $this->assertSame(2, $contrato->ciclo_atual);
        $this->assertSame('2026-10-26', $contrato->ciclo_inicio->toDateString());
        $this->assertSame('2026-10-26', Cobranca::where('ciclo', 2)->sole()->vencimento->toDateString());
    }

    public function test_paciente_que_ja_deve_comeca_o_contrato_bloqueado(): void
    {
        $paciente = $this->paciente();
        Cobranca::create(['paciente_id' => $paciente->id, 'titulo' => 'Sessão avulsa', 'valor' => 100, 'vencimento' => '2026-09-20']);

        $this->contratar($paciente, [self::QUARTA])->assertSessionHasNoErrors();

        $this->assertSame('bloqueado', Contrato::sole()->status);
        $this->assertSame('bloqueado', $paciente->fresh()->status_paciente);
        $this->assertSame([], $this->horarios($paciente));
    }

    public function test_encerrar_contrato_cancela_mensalidades_futuras_sem_pagamento_e_permite_outro_contrato(): void
    {
        $paciente = $this->paciente();
        $this->contratar($paciente, [self::QUARTA], inicio: '30/09/2026');

        $this->encerrarContrato($paciente)->assertSessionHasNoErrors();

        $this->assertSame('encerrado', Contrato::sole()->status);
        $this->assertSame('2026-09-28', Contrato::sole()->encerrado_em->toDateString());
        $this->assertSame('cancelado', Cobranca::sole()->situacao);
        $this->assertSame('inativo', $paciente->fresh()->status_paciente);

        $this->contratar($paciente, [self::SEGUNDA])->assertSessionHasNoErrors();
        $this->assertSame('ativo', $paciente->fresh()->status_paciente);
        $this->assertSame(2, Contrato::count());
    }

    public function test_mensalidade_paga_continua_ao_encerrar(): void
    {
        $paciente = $this->paciente();
        $this->contratar($paciente, [self::QUARTA]);
        $this->pagar(Cobranca::sole());

        $this->encerrarContrato($paciente);

        $this->assertSame('pago', Cobranca::sole()->situacao);
    }

    public function test_alterar_o_pacote_recalcula_o_fim_e_ajusta_a_mensalidade_em_aberto(): void
    {
        $paciente = $this->paciente();
        $this->contratar($paciente, [self::QUARTA], valor: 640);
        $contrato = Contrato::sole();

        $this->from("/pacientes/{$paciente->id}")->put("/contratos/{$contrato->id}", ['sessoes' => 8, 'valor' => 1200])
            ->assertSessionHasNoErrors();

        $this->assertSame('2026-11-18', $contrato->fresh()->ciclo_fim->toDateString());
        $this->assertEquals(1200, Cobranca::sole()->valor);
        $this->assertSame('Mensalidade — pacote 1 (8 sessões)', Cobranca::sole()->titulo);
    }

    public function test_incluir_horario_no_contrato_recalcula_o_fim_do_pacote(): void
    {
        $paciente = $this->paciente();
        $this->contratar($paciente, [self::QUARTA], sessoes: 4, inicio: '29/09/2026');
        $this->assertSame('2026-10-21', Contrato::sole()->ciclo_fim->toDateString());

        $this->matricular($paciente, weekday: 0, time: '13:50')->assertSessionHasNoErrors();

        // 30/09, 05/10, 07/10 e 12/10.
        $this->assertSame('2026-10-12', Contrato::sole()->ciclo_fim->toDateString());
        $this->assertSame(2, Contrato::sole()->matriculas()->count());
    }

    private function pagar(Cobranca $cobranca)
    {
        return $this->from('/financeiro')->post("/cobrancas/{$cobranca->id}/pagamento", [
            'data' => today()->format('d/m/Y'),
            'valor' => $cobranca->saldo(),
            'forma' => 'Pix',
        ]);
    }
}
