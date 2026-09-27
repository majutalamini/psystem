<?php

namespace Tests\Feature;

use App\Models\Consulta;
use Illuminate\Support\Carbon;

class AgendaMatriculaTest extends ConsultorioTestCase
{
    public function test_salvar_matricula_gera_as_consultas_das_proximas_quatro_semanas(): void
    {
        $paciente = $this->paciente();

        $this->matricular($paciente, weekday: 2)->assertRedirect()->assertSessionHasNoErrors();

        // Quartas-feiras até hoje + 4 semanas (26/10).
        $this->assertSame(
            ['2026-09-30 09:00', '2026-10-07 09:00', '2026-10-14 09:00', '2026-10-21 09:00'],
            $this->horarios($paciente),
        );

        $consulta = Consulta::where('paciente_id', $paciente->id)->first();
        $this->assertSame('agendado', $consulta->status);
        $this->assertSame('presencial', $consulta->modalidade);
        $this->assertSame($paciente->matricula->id, $consulta->matricula_id);
        $this->assertEquals(50, $consulta->duracao_minutos);
    }

    public function test_horario_de_hoje_que_ja_passou_nao_e_gerado(): void
    {
        $paciente = $this->paciente();

        // Hoje é segunda às 10:00; a sessão de hoje às 09:00 já passou.
        $this->matricular($paciente, weekday: 0, time: '09:00');

        $this->assertSame(
            ['2026-10-05 09:00', '2026-10-12 09:00', '2026-10-19 09:00', '2026-10-26 09:00'],
            $this->horarios($paciente),
        );
    }

    public function test_horario_ocupado_por_outro_paciente_e_pulado(): void
    {
        $outro = $this->paciente(['nome' => 'Outro']);
        Consulta::create([
            'paciente_id' => $outro->id,
            'data_hora_consulta' => Carbon::parse('2026-10-07 09:00'),
            'modalidade' => 'online',
        ]);
        $paciente = $this->paciente();

        $this->matricular($paciente, weekday: 2);

        $this->assertSame(['2026-09-30 09:00', '2026-10-14 09:00', '2026-10-21 09:00'], $this->horarios($paciente));
    }

    public function test_alterar_matricula_refaz_so_as_consultas_futuras_ainda_agendadas(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        Consulta::where('paciente_id', $paciente->id)->orderBy('data_hora_consulta')->first()->update(['status' => 'confirmado']);

        $this->matricular($paciente, weekday: 3, time: '14:00', valor: 250);

        // A quarta confirmada fica; as outras quartas saem; entram as quintas às 14:00.
        $this->assertSame(
            ['2026-09-30 09:00', '2026-10-01 14:00', '2026-10-08 14:00', '2026-10-15 14:00', '2026-10-22 14:00'],
            $this->horarios($paciente),
        );
        $this->assertSame(['2026-09-30 09:00'], $this->horarios($paciente, 'confirmado'));
        $this->assertEquals(250, $paciente->matricula()->first()->valor_sessao);
    }

    public function test_matricula_no_mesmo_dia_e_horario_de_outro_paciente_e_recusada(): void
    {
        $this->matricular($this->paciente(['nome' => 'Luiza']), weekday: 1, time: '15:00');
        $paciente = $this->paciente();

        $this->matricular($paciente, weekday: 1, time: '15:00')
            ->assertSessionHasErrors(['time' => 'Esse horário já é da matrícula de Luiza.']);
        $this->assertNull($paciente->matricula()->first());

        // Outro horário no mesmo dia pode.
        $this->matricular($paciente, weekday: 1, time: '16:00')->assertSessionHasNoErrors();
    }

    public function test_matricula_de_paciente_inativo_nao_bloqueia_o_horario(): void
    {
        $this->matricular($this->paciente(['nome' => 'Luiza', 'status_paciente' => 'inativo']), weekday: 1, time: '15:00');

        $this->matricular($this->paciente(), weekday: 1, time: '15:00')->assertSessionHasNoErrors();
    }

    public function test_remover_matricula_apaga_as_consultas_futuras_agendadas(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);

        $this->delete("/pacientes/{$paciente->id}/matricula")->assertRedirect();

        $this->assertSame([], $this->horarios($paciente));
        $this->assertNull($paciente->matricula()->first());
    }

    public function test_inativar_paciente_apaga_as_futuras_e_reativar_gera_de_novo(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);

        $formulario = [
            'name' => $paciente->nome,
            'cpf' => $paciente->cpf,
            'nascimento' => '01/01/1990',
            'phone' => $paciente->telefone,
        ];

        $this->put("/pacientes/{$paciente->id}", [...$formulario, 'status' => 'Inativo'])->assertSessionHasNoErrors();
        $this->assertSame([], $this->horarios($paciente));

        $this->put("/pacientes/{$paciente->id}", [...$formulario, 'status' => 'Ativo'])->assertSessionHasNoErrors();
        $this->assertCount(4, $this->horarios($paciente));
    }

    public function test_comando_diario_completa_a_janela_sem_duplicar(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);

        $this->artisan('agenda:gerar')->assertSuccessful();
        $this->assertCount(4, $this->horarios($paciente));

        // Uma semana depois, a janela anda e entra mais uma quarta.
        $this->travelTo(Carbon::parse('2026-10-05 10:00:00'));
        $this->artisan('agenda:gerar')->assertSuccessful();
        $this->assertSame(
            ['2026-09-30 09:00', '2026-10-07 09:00', '2026-10-14 09:00', '2026-10-21 09:00', '2026-10-28 09:00'],
            $this->horarios($paciente),
        );
    }

    public function test_consulta_cancelada_da_matricula_nao_volta_quando_o_comando_roda(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $primeira = Consulta::where('paciente_id', $paciente->id)->orderBy('data_hora_consulta')->first();

        $this->patch("/agenda/{$primeira->id}/status", ['status' => 'cancelado'])->assertSessionHasNoErrors();
        $this->artisan('agenda:gerar');

        $this->assertCount(3, $this->horarios($paciente, 'agendado'));
        $this->assertCount(1, $this->horarios($paciente, 'cancelado'));
    }

    public function test_agendamento_manual_em_horario_que_ja_passou_e_recusado(): void
    {
        $agendar = fn (string $date, string $hora) => $this->from('/agenda')->post('/agenda', [
            'patientId' => $this->paciente()->id,
            'date' => $date,
            'hora' => $hora,
            'tipo' => 'Consulta presencial',
            'status' => 'Pendente',
        ]);

        // Agora é segunda, 28/09/2026 às 10:00.
        $agendar('2026-09-28', '09:00')->assertSessionHasErrors(['hora' => 'Esse horário já passou.']);
        $agendar('2026-09-25', '15:00')->assertSessionHasErrors(['hora' => 'Esse horário já passou.']);
        $agendar('2026-09-28', '11:00')->assertSessionHasNoErrors();

        $this->assertSame(1, Consulta::count());
    }

    public function test_agendamento_manual_em_horario_ocupado_e_recusado(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);

        $this->from('/agenda')->post('/agenda', [
            'patientId' => $this->paciente(['nome' => 'Outro'])->id,
            'date' => '2026-09-30',
            'hora' => '09:00',
            'tipo' => 'Consulta online',
            'status' => 'Pendente',
        ])->assertRedirect('/agenda')->assertSessionHasErrors('hora');

        $this->assertSame(1, Consulta::where('data_hora_consulta', Carbon::parse('2026-09-30 09:00'))->count());
    }
}
