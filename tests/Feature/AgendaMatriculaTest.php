<?php

namespace Tests\Feature;

use App\Models\Configuracao;
use App\Models\Consulta;
use App\Notifications\ConsultaEmBreve;
use Illuminate\Support\Carbon;

class AgendaMatriculaTest extends ConsultorioTestCase
{
    public function test_salvar_matricula_gera_as_consultas_das_proximas_oito_semanas(): void
    {
        $paciente = $this->paciente();

        $this->matricular($paciente, weekday: 2)->assertRedirect()->assertSessionHasNoErrors();

        // Quartas-feiras até hoje + 8 semanas (23/11).
        $this->assertSame(
            [
                '2026-09-30 08:50', '2026-10-07 08:50', '2026-10-14 08:50', '2026-10-21 08:50',
                '2026-10-28 08:50', '2026-11-04 08:50', '2026-11-11 08:50', '2026-11-18 08:50',
            ],
            $this->horarios($paciente),
        );

        $consulta = Consulta::where('paciente_id', $paciente->id)->first();
        $this->assertSame('agendado', $consulta->status);
        $this->assertSame('Matriculado', $consulta->rotuloStatus());
        $this->assertSame('presencial', $consulta->modalidade);
        $this->assertSame($paciente->matriculas()->first()->id, $consulta->matricula_id);
        $this->assertEquals(50, $consulta->duracao_minutos);
    }

    public function test_horario_de_hoje_que_ja_passou_nao_e_gerado(): void
    {
        $paciente = $this->paciente();

        // Hoje é segunda às 10:00; a sessão de hoje às 08:50 já passou.
        $this->matricular($paciente, weekday: 0, time: '08:50');

        $this->assertSame(
            [
                '2026-10-05 08:50', '2026-10-12 08:50', '2026-10-19 08:50', '2026-10-26 08:50',
                '2026-11-02 08:50', '2026-11-09 08:50', '2026-11-16 08:50', '2026-11-23 08:50',
            ],
            $this->horarios($paciente),
        );
    }

    public function test_horario_ocupado_por_outro_paciente_e_pulado(): void
    {
        $outro = $this->paciente(['nome' => 'Outro']);
        Consulta::create([
            'paciente_id' => $outro->id,
            'data_hora_consulta' => Carbon::parse('2026-10-07 08:50'),
            'modalidade' => 'online',
        ]);
        $paciente = $this->paciente();

        $this->matricular($paciente, weekday: 2);

        $this->assertSame(
            [
                '2026-09-30 08:50', '2026-10-14 08:50', '2026-10-21 08:50',
                '2026-10-28 08:50', '2026-11-04 08:50', '2026-11-11 08:50', '2026-11-18 08:50',
            ],
            $this->horarios($paciente),
        );
    }

    public function test_alterar_matricula_refaz_so_as_consultas_futuras_ainda_agendadas(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        Consulta::where('paciente_id', $paciente->id)->orderBy('data_hora_consulta')->first()->update(['status' => 'confirmado']);

        $this->alterarMatricula($paciente->matriculas()->first(), weekday: 3, time: '13:50', valor: 250);

        // A quarta confirmada fica; as outras quartas saem; entram as quintas às 13:50.
        $this->assertSame(
            [
                '2026-09-30 08:50',
                '2026-10-01 13:50', '2026-10-08 13:50', '2026-10-15 13:50', '2026-10-22 13:50',
                '2026-10-29 13:50', '2026-11-05 13:50', '2026-11-12 13:50', '2026-11-19 13:50',
            ],
            $this->horarios($paciente),
        );
        $this->assertSame(['2026-09-30 08:50'], $this->horarios($paciente, 'confirmado'));
        $this->assertEquals(250, $paciente->matriculas()->first()->valor_sessao);
    }

    public function test_matricula_no_mesmo_dia_e_horario_de_outro_paciente_e_recusada(): void
    {
        $this->matricular($this->paciente(['nome' => 'Luiza']), weekday: 1, time: '14:40');
        $paciente = $this->paciente();

        $this->matricular($paciente, weekday: 1, time: '14:40')
            ->assertSessionHasErrors(['time' => 'Esse horário já é da matrícula de Luiza.']);
        $this->assertNull($paciente->matriculas()->first());

        // Outro horário no mesmo dia pode.
        $this->matricular($paciente, weekday: 1, time: '15:30')->assertSessionHasNoErrors();
    }

    public function test_matricula_encerrada_nao_bloqueia_o_horario(): void
    {
        $luiza = $this->paciente(['nome' => 'Luiza']);
        $this->matricular($luiza, weekday: 1, time: '14:40');
        $this->delete('/matriculas/'.$luiza->matriculas()->first()->id);

        $this->matricular($this->paciente(), weekday: 1, time: '14:40')->assertSessionHasNoErrors();
    }

    public function test_encerrar_matricula_apaga_as_consultas_futuras_guarda_o_historico_e_inativa_o_paciente(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $confirmada = Consulta::where('paciente_id', $paciente->id)->orderBy('data_hora_consulta')->first();
        $confirmada->update(['status' => 'confirmado']);

        $matricula = $paciente->matriculas()->first();
        $this->delete("/matriculas/{$matricula->id}")->assertRedirect();

        // Só a consulta já confirmada continua na agenda.
        $this->assertSame(['2026-09-30 08:50'], $this->horarios($paciente));
        $this->assertSame('encerrada', $matricula->fresh()->status_matricula);
        $this->assertSame('2026-09-28', $matricula->fresh()->fim_da_matricula->toDateString());
        $this->assertSame('inativo', $paciente->fresh()->status_paciente);
    }

    public function test_nova_matricula_depois_de_encerrar_reativa_o_paciente_e_gera_de_novo(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);

        $this->delete('/matriculas/'.$paciente->matriculas()->first()->id);
        $this->assertSame([], $this->horarios($paciente));
        $this->assertSame('inativo', $paciente->fresh()->status_paciente);

        $this->matricular($paciente, weekday: 2)->assertSessionHasNoErrors();
        $this->assertSame('ativo', $paciente->fresh()->status_paciente);
        $this->assertCount(8, $this->horarios($paciente));
    }

    public function test_comando_diario_completa_a_janela_sem_duplicar(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);

        $this->artisan('agenda:gerar')->assertSuccessful();
        $this->assertCount(8, $this->horarios($paciente));

        // Uma semana depois, a janela anda e entra mais uma quarta.
        $this->travelTo(Carbon::parse('2026-10-05 10:00:00'));
        $this->artisan('agenda:gerar')->assertSuccessful();
        $this->assertSame(
            [
                '2026-09-30 08:50', '2026-10-07 08:50', '2026-10-14 08:50', '2026-10-21 08:50',
                '2026-10-28 08:50', '2026-11-04 08:50', '2026-11-11 08:50', '2026-11-18 08:50',
                '2026-11-25 08:50',
            ],
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

        $this->assertCount(7, $this->horarios($paciente, 'agendado'));
        $this->assertCount(1, $this->horarios($paciente, 'cancelado'));
    }

    public function test_agendamento_manual_em_horario_que_ja_passou_e_recusado(): void
    {
        $agendar = fn (string $date, string $hora) => $this->from('/agenda')->post('/agenda', [
            'patientId' => $this->paciente()->id,
            'date' => $date,
            'hora' => $hora,
            'tipo' => 'Consulta presencial',
            'status' => 'Agendado',
        ]);

        // Agora é segunda, 28/09/2026 às 10:00.
        $agendar('2026-09-28', '08:50')->assertSessionHasErrors(['hora' => 'Esse horário já passou.']);
        $agendar('2026-09-25', '14:40')->assertSessionHasErrors(['hora' => 'Esse horário já passou.']);
        $agendar('2026-09-28', '10:30')->assertSessionHasNoErrors();

        $consulta = Consulta::sole();
        $this->assertSame('agendado', $consulta->status);
        $this->assertSame('Agendado', $consulta->rotuloStatus());
    }

    public function test_agendamento_manual_em_horario_ocupado_e_recusado(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);

        $this->from('/agenda')->post('/agenda', [
            'patientId' => $this->paciente(['nome' => 'Outro'])->id,
            'date' => '2026-09-30',
            'hora' => '08:50',
            'tipo' => 'Consulta online',
            'status' => 'Matriculado',
        ])->assertRedirect('/agenda')->assertSessionHasErrors('hora');

        $this->assertSame(1, Consulta::where('data_hora_consulta', Carbon::parse('2026-09-30 08:50'))->count());
    }

    public function test_dia_sem_atendimento_e_horario_fora_do_expediente_sao_recusados(): void
    {
        $paciente = $this->paciente();

        // Sábado (weekday: 5) não está em dias_atendimento padrão (Seg a Sex).
        $this->matricular($paciente, weekday: 5, time: '08:50')
            ->assertSessionHasErrors(['weekday' => 'Não há atendimento nesse dia da semana.']);

        // 09:00 não é múltiplo de 50 min a partir das 08:00.
        $this->matricular($paciente, weekday: 2, time: '09:00')
            ->assertSessionHasErrors(['time' => 'Esse horário está fora do expediente.']);

        // Na agenda avulsa: 2026-10-03 é sábado.
        $this->from('/agenda')->post('/agenda', [
            'patientId' => $paciente->id,
            'date' => '2026-10-03',
            'hora' => '08:50',
            'tipo' => 'Consulta presencial',
            'status' => 'Agendado',
        ])->assertSessionHasErrors(['date' => 'Não há atendimento nesse dia da semana.']);

        $this->from('/agenda')->post('/agenda', [
            'patientId' => $paciente->id,
            'date' => '2026-09-30',
            'hora' => '09:00',
            'tipo' => 'Consulta presencial',
            'status' => 'Agendado',
        ])->assertSessionHasErrors(['hora' => 'Esse horário está fora do expediente.']);
    }

    public function test_geracao_da_agenda_pula_dia_sem_atendimento_e_configuracao_avisa_matriculas_fora(): void
    {
        $paciente = $this->paciente(['nome' => 'Carla Dias']);
        $this->matricular($paciente, weekday: 2, time: '08:50')->assertSessionHasNoErrors();

        // Altera configuração tirando Quarta e mudando início para 09:00.
        $this->put('/configuracoes', [
            'perfil' => ['nome' => 'Dra. Teste', 'crp' => '12/00001', 'email' => 'teste@psystem.com', 'telefone' => ''],
            'senha' => ['atual' => '', 'nova' => ''],
            'horario' => ['dias' => ['Seg', 'Ter'], 'inicio' => '09:00', 'fim' => '18:00', 'duracao' => 50],
            'goals' => ['faturamentoMensal' => 5000, 'horasSemanais' => 10, 'sessoesSemanais' => 12, 'novosPacientesMes' => 2],
            'whatsapp' => ['enabled' => false, 'numero' => '', 'diasAntes' => 1, 'lembrete' => '', 'retorno' => '', 'cobranca' => ''],
        ])->assertSessionHasNoErrors()
            ->assertSessionHas('aviso', 'Alterações salvas com sucesso. Atenção: matrícula(s) fora do expediente: Carla Dias (quarta-feira às 08:50).');

        // Se limpar e tentar gerar com quarta fora dos dias de atendimento, não gera nenhuma consulta.
        Consulta::query()->delete();
        $this->artisan('agenda:gerar')->assertSuccessful();
        $this->assertSame([], $this->horarios($paciente));
    }

    public function test_visoes_dia_semana_e_mes_devolvem_apenas_as_consultas_do_periodo(): void
    {
        $paciente = $this->paciente();
        // Quarta (30/09), Quinta (01/10) e outra semana de outubro (15/10).
        Consulta::create(['paciente_id' => $paciente->id, 'data_hora_consulta' => Carbon::parse('2026-09-30 08:50'), 'modalidade' => 'presencial']);
        Consulta::create(['paciente_id' => $paciente->id, 'data_hora_consulta' => Carbon::parse('2026-10-01 08:50'), 'modalidade' => 'presencial']);
        Consulta::create(['paciente_id' => $paciente->id, 'data_hora_consulta' => Carbon::parse('2026-10-15 08:50'), 'modalidade' => 'presencial']);

        $eventos = fn (string $url) => $this->get($url)->viewData('page')['props']['events'];

        $this->assertCount(1, $eventos('/agenda?data=2026-09-30&visao=dia'));
        $this->assertCount(2, $eventos('/agenda?data=2026-09-30&visao=semana'));
        $this->assertCount(2, $eventos('/agenda?data=2026-10-01&visao=mes'));
    }

    public function test_transicoes_de_status_permitidas_e_bloqueadas(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $consulta = Consulta::where('paciente_id', $paciente->id)->orderBy('data_hora_consulta')->first();

        // Matriculado (agendado) não pode virar Falta direto.
        $this->patchJson("/agenda/{$consulta->id}/status", ['status' => 'falta'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
        $this->assertSame('agendado', $consulta->fresh()->status);

        // Matriculado pode virar Realizado direto.
        $this->patch("/agenda/{$consulta->id}/status", ['status' => 'realizado'])->assertSessionHasNoErrors();
        $this->assertSame('realizado', $consulta->fresh()->status);

        // Depois de cancelado, não pode mudar para mais nada.
        $this->patch("/agenda/{$consulta->id}/status", ['status' => 'cancelado'])->assertSessionHasNoErrors();
        $this->patchJson("/agenda/{$consulta->id}/status", ['status' => 'realizado'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
        $this->assertSame('cancelado', $consulta->fresh()->status);
    }

    public function test_email_consulta_em_breve_mostra_matriculado_ou_agendado(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $matriculada = Consulta::where('paciente_id', $paciente->id)->first();

        $avulsa = Consulta::create([
            'paciente_id' => $paciente->id,
            'data_hora_consulta' => Carbon::parse('2026-10-01 10:30'),
            'modalidade' => 'online',
            'status' => 'agendado',
        ]);

        $mailMatriculada = implode("\n", (new ConsultaEmBreve($matriculada))->toMail($this->psicologa)->introLines);
        $mailAvulsa = implode("\n", (new ConsultaEmBreve($avulsa))->toMail($this->psicologa)->introLines);

        $this->assertStringContainsString('**Situação:** Matriculado', $mailMatriculada);
        $this->assertStringContainsString('**Situação:** Agendado', $mailAvulsa);
    }

    public function test_pausa_de_almoco_e_intervalo_entre_sessoes_customizaveis(): void
    {
        // Sessão de 50 min + 10 min de intervalo e almoço das 12:00 às 13:30.
        $this->put('/configuracoes', [
            'perfil' => ['nome' => 'Dra. Teste', 'crp' => '12/00001', 'email' => 'teste@psystem.com', 'telefone' => ''],
            'senha' => ['atual' => '', 'nova' => ''],
            'horario' => [
                'dias' => ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
                'inicio' => '08:00',
                'fim' => '16:30',
                'duracao' => 50,
                'intervalo' => 10,
                'almocoInicio' => '12:00',
                'almocoFim' => '13:30',
            ],
            'goals' => ['faturamentoMensal' => 5000, 'horasSemanais' => 10, 'sessoesSemanais' => 12, 'novosPacientesMes' => 2],
            'whatsapp' => ['enabled' => false, 'numero' => '', 'diasAntes' => 1, 'lembrete' => '', 'retorno' => '', 'cobranca' => ''],
        ])->assertSessionHasNoErrors();

        $this->assertSame(
            ['08:00', '09:00', '10:00', '11:00', '13:30', '14:30', '15:30'],
            Configuracao::atual()->horarios(),
        );

        // Sessão de 30 minutos com 30 minutos de almoço (12:00 às 12:30).
        Configuracao::atual()->update([
            'expediente_inicio' => '11:00',
            'expediente_fim' => '14:00',
            'duracao_sessao' => 30,
            'intervalo_sessao' => 0,
            'almoco_inicio' => '12:00',
            'almoco_fim' => '12:30',
        ]);

        $this->assertSame(
            ['11:00', '11:30', '12:30', '13:00', '13:30'],
            Configuracao::atual()->horarios(),
        );
    }

    public function test_validacao_em_portugues_e_pagina_404_amigavel(): void
    {
        $this->post('/agenda', [])->assertSessionHasErrors([
            'patientId' => 'O campo paciente é obrigatório.',
            'date' => 'O campo data é obrigatório.',
            'hora' => 'O campo horário é obrigatório.',
        ]);

        $resposta = $this->get('/rota-que-nao-existe');
        $resposta->assertNotFound();
        $this->assertSame('Não encontramos o que você procurava.', $resposta->getContent());
    }
}
