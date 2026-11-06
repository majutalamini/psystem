<?php

namespace Tests\Feature;

use App\Models\Cobranca;
use App\Models\Consulta;
use Illuminate\Support\Carbon;

/** Hoje, nos testes, é segunda 28/09/2026 às 10:00; o vencimento padrão é dia 10. */
class MensalidadeTest extends ConsultorioTestCase
{
    private function avulsa(int $pacienteId, mixed $valor, string $date = '2026-09-30', string $hora = '08:50')
    {
        return $this->from('/agenda')->post('/agenda', [
            'patientId' => $pacienteId,
            'date' => $date,
            'hora' => $hora,
            'tipo' => 'Consulta presencial',
            'status' => 'Agendado',
            'valor' => $valor,
        ]);
    }

    public function test_matricula_com_valor_lanca_a_mensalidade_em_aberto_no_perfil_do_paciente(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2, valor: 350)->assertSessionHasNoErrors();

        // O dia 10 de setembro já passou: a primeira mensalidade é a de outubro, para não nascer atrasada.
        $cobranca = Cobranca::sole();
        $this->assertSame($paciente->id, $cobranca->paciente_id);
        $this->assertSame($paciente->matriculas()->first()->id, $cobranca->matricula_id);
        $this->assertSame('Mensalidade — 10/2026', $cobranca->titulo);
        $this->assertEquals(350, $cobranca->valor);
        $this->assertSame('2026-10-10', $cobranca->vencimento->toDateString());
        $this->assertSame('pendente', $cobranca->situacao);
        $this->assertSame('Pendente', $cobranca->status());

        $recebiveis = $this->get("/pacientes/{$paciente->id}")->assertOk()->viewData('page')['props']['receivables'];
        $this->assertSame(['Mensalidade — 10/2026'], collect($recebiveis)->pluck('referencia')->all());
    }

    public function test_dia_de_vencimento_do_perfil_define_a_data_da_mensalidade(): void
    {
        $paciente = $this->paciente(['dia_vencimento' => 30]);

        $this->matricular($paciente, weekday: 2)->assertSessionHasNoErrors();

        $cobranca = Cobranca::sole();
        $this->assertSame('Mensalidade — 09/2026', $cobranca->titulo);
        $this->assertSame('2026-09-30', $cobranca->vencimento->toDateString());
    }

    public function test_vencimento_31_vira_o_ultimo_dia_dos_meses_curtos(): void
    {
        $paciente = $this->paciente(['dia_vencimento' => 31]);
        $this->matricular($paciente, weekday: 2);
        $this->travelTo(Carbon::parse('2026-11-02 10:00:00'));

        $this->artisan('mensalidades:gerar')->assertSuccessful();

        $this->assertSame(
            ['2026-09-30', '2026-11-30'],
            Cobranca::orderBy('vencimento')->get()->map(fn ($c) => $c->vencimento->toDateString())->all(),
        );
    }

    public function test_matricula_sem_valor_nao_lanca_mensalidade(): void
    {
        $this->matricular($this->paciente(), weekday: 2, valor: 0)->assertSessionHasNoErrors();

        $this->assertSame(0, Cobranca::count());
    }

    public function test_comando_mensal_lanca_uma_por_mes_sem_duplicar(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);

        $this->artisan('mensalidades:gerar')->assertSuccessful();
        $this->artisan('mensalidades:gerar')->assertSuccessful();
        $this->assertSame(['2026-10-01'], $this->competencias(), 'em setembro nada novo: a de outubro já foi lançada');

        $this->travelTo(Carbon::parse('2026-10-05 01:10:00'));
        $this->artisan('mensalidades:gerar')->assertSuccessful();
        $this->assertSame(['2026-10-01'], $this->competencias());

        $this->travelTo(Carbon::parse('2026-11-01 01:10:00'));
        $this->artisan('mensalidades:gerar')->assertSuccessful();
        $this->artisan('mensalidades:gerar')->assertSuccessful();
        $this->assertSame(['2026-10-01', '2026-11-01'], $this->competencias());
    }

    public function test_alterar_o_valor_da_matricula_atualiza_so_as_mensalidades_em_aberto(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2, valor: 200);
        $matricula = $paciente->matriculas()->first();

        $this->alterarMatricula($matricula, weekday: 2, valor: 260)->assertSessionHasNoErrors();

        $this->assertSame(1, Cobranca::count(), 'não duplica');
        $this->assertEquals(260, Cobranca::sole()->valor);

        // Mensalidade que já recebeu pagamento não muda.
        $cobranca = Cobranca::sole();
        $this->post("/cobrancas/{$cobranca->id}/pagamento", ['data' => '28/09/2026', 'valor' => 50, 'forma' => 'Pix']);
        $this->alterarMatricula($matricula, weekday: 2, valor: 300)->assertSessionHasNoErrors();
        $this->assertEquals(260, $cobranca->fresh()->valor);
    }

    public function test_encerrar_a_matricula_cancela_as_mensalidades_futuras_em_aberto(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);

        $this->delete('/matriculas/'.$paciente->matriculas()->first()->id);

        $this->assertSame('cancelado', Cobranca::sole()->situacao);
        $recebiveis = $this->get("/pacientes/{$paciente->id}")->viewData('page')['props']['receivables'];
        $this->assertSame([], $recebiveis);
    }

    public function test_mensalidade_ja_recebida_continua_ao_encerrar_a_matricula(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $cobranca = Cobranca::sole();
        $this->post("/cobrancas/{$cobranca->id}/pagamento", ['data' => '28/09/2026', 'valor' => 200, 'forma' => 'Pix']);

        $this->delete('/matriculas/'.$paciente->matriculas()->first()->id);

        $this->assertSame('pago', $cobranca->fresh()->situacao);
    }

    public function test_mudar_o_dia_de_vencimento_ajusta_as_mensalidades_em_aberto(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);

        $this->patch("/pacientes/{$paciente->id}/vencimento", ['dia' => 20])->assertSessionHasNoErrors();

        $this->assertSame(20, $paciente->fresh()->dia_vencimento);
        $this->assertSame('2026-10-20', Cobranca::sole()->vencimento->toDateString());
    }

    public function test_dia_de_vencimento_precisa_ficar_entre_1_e_31(): void
    {
        $paciente = $this->paciente();

        foreach ([0, 32, ''] as $dia) {
            $this->from("/pacientes/{$paciente->id}")->patch("/pacientes/{$paciente->id}/vencimento", ['dia' => $dia])
                ->assertSessionHasErrors('dia');
        }
        $this->assertSame(10, $paciente->fresh()->dia_vencimento);
    }

    public function test_consulta_avulsa_com_valor_fica_em_aberto_no_perfil_sem_recorrencia(): void
    {
        $paciente = $this->paciente();

        $this->avulsa($paciente->id, 180)->assertSessionHasNoErrors();

        $consulta = Consulta::sole();
        $this->assertEquals(180, $consulta->valor);
        $this->assertNull($consulta->matricula_id);

        $cobranca = Cobranca::sole();
        $this->assertSame($consulta->id, $cobranca->agenda_id);
        $this->assertNull($cobranca->matricula_id);
        $this->assertSame($paciente->id, $cobranca->paciente_id);
        $this->assertEquals(180, $cobranca->valor);
        $this->assertSame('2026-09-30', $cobranca->vencimento->toDateString());
        $this->assertSame('Consulta avulsa — 30/09/2026', $cobranca->titulo);

        // Rodar os comandos de geração não cria nada recorrente a partir dela.
        $this->artisan('mensalidades:gerar')->assertSuccessful();
        $this->artisan('agenda:gerar')->assertSuccessful();
        $this->assertSame(1, Cobranca::count());
    }

    public function test_consulta_avulsa_exige_o_valor(): void
    {
        $paciente = $this->paciente();

        $this->avulsa($paciente->id, '')->assertSessionHasErrors('valor');
        $this->avulsa($paciente->id, -5)->assertSessionHasErrors('valor');
        $this->assertSame(0, Consulta::count());
    }

    public function test_consulta_avulsa_de_valor_zero_nao_gera_cobranca(): void
    {
        $this->avulsa($this->paciente()->id, 0)->assertSessionHasNoErrors();

        $this->assertSame(1, Consulta::count());
        $this->assertSame(0, Cobranca::count());
    }

    public function test_cancelar_a_consulta_avulsa_cancela_a_cobranca_mas_falta_continua_cobrada(): void
    {
        $paciente = $this->paciente();
        $this->avulsa($paciente->id, 180, hora: '08:50');
        $this->avulsa($paciente->id, 150, hora: '09:40');
        [$primeira, $segunda] = Consulta::orderBy('data_hora_consulta')->get()->all();

        $this->patch("/agenda/{$primeira->id}/status", ['status' => 'cancelado'])->assertSessionHasNoErrors();
        $this->patch("/agenda/{$segunda->id}/status", ['status' => 'falta'])->assertSessionHasNoErrors();

        $this->assertSame('cancelado', $primeira->cobranca()->first()->situacao);
        $this->assertSame('pendente', $segunda->cobranca()->first()->situacao);
    }

    public function test_cobranca_pendente_vencida_aparece_como_atrasada(): void
    {
        $cobranca = Cobranca::create([
            'paciente_id' => $this->paciente()->id,
            'titulo' => 'Sessão avulsa',
            'valor' => 100,
            'vencimento' => '2026-09-27',
        ]);

        $this->assertSame('Atrasado', $cobranca->status());
        $this->assertSame('Pendente', $cobranca->fill(['vencimento' => '2026-09-28'])->status());
    }

    private function competencias(): array
    {
        return Cobranca::orderBy('competencia')->get()->map(fn ($c) => $c->competencia->toDateString())->all();
    }
}
