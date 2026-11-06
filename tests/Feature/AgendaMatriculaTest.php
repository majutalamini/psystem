<?php

namespace Tests\Feature;

use App\Actions\CriarConsulta;
use App\Models\Configuracao;
use App\Models\Consulta;
use App\Notifications\ConsultaEmBreve;
use Illuminate\Support\Carbon;

class AgendaMatriculaTest extends ConsultorioTestCase
{
    public function test_salvar_matricula_gera_as_consultas_da_janela_de_dois_meses(): void
    {
        $paciente = $this->paciente();

        $this->matricular($paciente, weekday: 2)->assertRedirect()->assertSessionHasNoErrors();

        // Hoje é segunda 28/09; a janela vai até domingo 11/10 (14 dias com hoje).
        $this->assertSame(['2026-09-30 08:50', '2026-10-07 08:50', '2026-10-14 08:50', '2026-10-21 08:50', '2026-10-28 08:50', '2026-11-04 08:50', '2026-11-11 08:50', '2026-11-18 08:50', '2026-11-25 08:50'], $this->horarios($paciente));

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

        $this->assertSame(['2026-10-05 08:50', '2026-10-12 08:50', '2026-10-19 08:50', '2026-10-26 08:50', '2026-11-02 08:50', '2026-11-09 08:50', '2026-11-16 08:50', '2026-11-23 08:50'], $this->horarios($paciente));
    }

    public function test_sem_limite_outro_paciente_no_mesmo_horario_nao_impede_a_geracao(): void
    {
        $outro = $this->paciente(['nome' => 'Outro']);
        CriarConsulta::executar(['paciente_id' => $outro->id, 'data_hora_consulta' => Carbon::parse('2026-10-07 08:50'), 'modalidade' => 'online']);
        $paciente = $this->paciente();

        $this->matricular($paciente, weekday: 2)->assertSessionHasNoErrors();

        $this->assertSame(['2026-09-30 08:50', '2026-10-07 08:50', '2026-10-14 08:50', '2026-10-21 08:50', '2026-10-28 08:50', '2026-11-04 08:50', '2026-11-11 08:50', '2026-11-18 08:50', '2026-11-25 08:50'], $this->horarios($paciente));
        $this->assertSame(2, Consulta::where('data_hora_consulta', Carbon::parse('2026-10-07 08:50'))->count());
    }

    public function test_horario_lotado_pelo_limite_e_pulado_na_geracao(): void
    {
        $this->limitar(1);
        $outro = $this->paciente(['nome' => 'Outro']);
        CriarConsulta::executar(['paciente_id' => $outro->id, 'data_hora_consulta' => Carbon::parse('2026-10-07 08:50'), 'modalidade' => 'online']);
        $paciente = $this->paciente();

        $this->matricular($paciente, weekday: 2);

        $this->assertSame(['2026-09-30 08:50', '2026-10-14 08:50', '2026-10-21 08:50', '2026-10-28 08:50', '2026-11-04 08:50', '2026-11-11 08:50', '2026-11-18 08:50', '2026-11-25 08:50'], $this->horarios($paciente));
    }

    public function test_alterar_matricula_refaz_so_as_consultas_futuras_ainda_agendadas(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        Consulta::where('paciente_id', $paciente->id)->orderBy('data_hora_consulta')->first()->update(['status' => 'confirmado']);

        $this->alterarMatricula($paciente->matriculas()->first(), weekday: 3, time: '13:50', valor: 250);

        // A quarta confirmada fica; a outra quarta sai; entram as quintas da janela às 13:50.
        $this->assertSame(['2026-09-30 08:50', '2026-10-01 13:50', '2026-10-08 13:50', '2026-10-15 13:50', '2026-10-22 13:50', '2026-10-29 13:50', '2026-11-05 13:50', '2026-11-12 13:50', '2026-11-19 13:50', '2026-11-26 13:50'], $this->horarios($paciente));
        $this->assertSame(['2026-09-30 08:50'], $this->horarios($paciente, 'confirmado'));
        $this->assertEquals(250, $paciente->matriculas()->first()->valor_sessao);
    }

    public function test_matricula_no_mesmo_horario_de_outro_paciente_depende_do_limite(): void
    {
        $this->matricular($this->paciente(['nome' => 'Luiza']), weekday: 1, time: '14:40');

        // Sem limite (padrão): outro paciente pode ter matrícula no mesmo dia e horário.
        $this->matricular($this->paciente(), weekday: 1, time: '14:40')->assertSessionHasNoErrors();

        // Com limite de 2, um terceiro paciente é recusado.
        $this->limitar(2);
        $terceiro = $this->paciente(['nome' => 'Terceiro']);
        $this->matricular($terceiro, weekday: 1, time: '14:40')
            ->assertSessionHasErrors(['time' => 'Esse horário já atingiu o limite de 2 consultas simultâneas.']);
        $this->assertNull($terceiro->matriculas()->first());

        // Com limite 1, a mensagem diz de quem é o horário; outro horário no mesmo dia pode.
        $this->limitar(1);
        $quarto = $this->paciente(['nome' => 'Quarto']);
        $this->matricular($quarto, weekday: 3, time: '14:40');
        $this->matricular($terceiro, weekday: 3, time: '14:40')
            ->assertSessionHasErrors(['time' => 'Esse horário já é da matrícula de Quarto.']);
        $this->matricular($terceiro, weekday: 3, time: '15:30')->assertSessionHasNoErrors();
    }

    public function test_mesmo_paciente_nao_repete_o_horario_em_duas_matriculas(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 1, time: '14:40');

        $this->matricular($paciente, weekday: 1, time: '14:40')
            ->assertSessionHasErrors(['time' => 'Esse horário já é de outra matrícula deste paciente.']);
    }

    public function test_matricula_encerrada_nao_bloqueia_o_horario(): void
    {
        $this->limitar(1);
        $luiza = $this->paciente(['nome' => 'Luiza']);
        $this->matricular($luiza, weekday: 1, time: '14:40');
        $this->delete('/matriculas/'.$luiza->matriculas()->first()->id);

        $this->matricular($this->paciente(), weekday: 1, time: '14:40')->assertSessionHasNoErrors();
    }

    public function test_encerrar_a_ultima_matricula_inativa_e_apaga_todas_as_consultas_futuras(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $confirmada = Consulta::where('paciente_id', $paciente->id)->orderBy('data_hora_consulta')->first();
        $confirmada->update(['status' => 'confirmado']);
        $passada = Consulta::create(['paciente_id' => $paciente->id, 'data_hora_consulta' => Carbon::parse('2026-09-21 08:50'),
            'duracao_minutos' => 50, 'modalidade' => 'presencial', 'status' => 'realizado']);

        $matricula = $paciente->matriculas()->first();
        $this->delete("/matriculas/{$matricula->id}")->assertRedirect()->assertSessionHasNoErrors();

        // Inativar apaga as futuras, inclusive a confirmada; o passado fica.
        $this->assertSame(['2026-09-21 08:50'], $this->horarios($paciente));
        $this->assertTrue($passada->fresh()->exists);
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
        $this->assertCount(9, $this->horarios($paciente));
    }

    public function test_comando_completa_a_janela_sem_duplicar_e_registra_a_execucao(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $this->assertNull(Configuracao::atual()->agenda_gerada_em);

        $this->artisan('agenda:gerar')->assertSuccessful();
        $this->assertCount(9, $this->horarios($paciente));
        $this->assertTrue(Configuracao::atual()->agenda_gerada_em->eq(now()));

        // Uma semana depois, a janela anda e entra mais uma quarta.
        $this->travelTo(Carbon::parse('2026-10-05 10:00:00'));
        $this->artisan('agenda:gerar')->assertSuccessful();
        $this->assertSame(['2026-09-30 08:50', '2026-10-07 08:50', '2026-10-14 08:50', '2026-10-21 08:50', '2026-10-28 08:50', '2026-11-04 08:50', '2026-11-11 08:50', '2026-11-18 08:50', '2026-11-25 08:50', '2026-12-02 08:50'], $this->horarios($paciente));
    }

    public function test_recuperacao_apos_dias_sem_scheduler_nao_cria_sessao_retroativa(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);

        // Scheduler parado por 10 dias: volta numa quinta, 08/10.
        $this->travelTo(Carbon::parse('2026-10-08 10:00:00'));
        $situacao = $this->get('/agenda')->viewData('page')['props']['agendaWindow'];
        $this->assertTrue($situacao['atrasada']);

        $this->artisan('agenda:gerar')->assertSuccessful();

        // Completa a janela (08/10–21/10) sem recriar o que passou nem duplicar 30/09 e 07/10.
        $this->assertSame(['2026-09-30 08:50', '2026-10-07 08:50', '2026-10-14 08:50', '2026-10-21 08:50', '2026-10-28 08:50', '2026-11-04 08:50', '2026-11-11 08:50', '2026-11-18 08:50', '2026-11-25 08:50', '2026-12-02 08:50'], $this->horarios($paciente));
        $situacao = $this->get('/agenda')->viewData('page')['props']['agendaWindow'];
        $this->assertFalse($situacao['atrasada']);
        $this->assertSame('2026-12-08', $situacao['ate']);
    }

    public function test_abrir_a_agenda_nao_grava_consultas(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);

        $this->get('/agenda?data=2026-12-02&visao=mes&grade=1')->assertOk();
        $this->get('/agenda?data=2026-11-18&visao=semana')->assertOk();

        $this->assertSame(['2026-09-30 08:50', '2026-10-07 08:50', '2026-10-14 08:50', '2026-10-21 08:50', '2026-10-28 08:50', '2026-11-04 08:50', '2026-11-11 08:50', '2026-11-18 08:50', '2026-11-25 08:50'], $this->horarios($paciente));
    }

    public function test_consultas_ja_gravadas_alem_da_janela_continuam(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $matricula = $paciente->matriculas()->first();
        // Como as geradas pela regra antiga de 8 semanas.
        Consulta::create(['paciente_id' => $paciente->id, 'matricula_id' => $matricula->id, 'data_hora_consulta' => Carbon::parse('2026-12-16 08:50'),
            'duracao_minutos' => 50, 'modalidade' => 'presencial', 'status' => 'agendado']);

        $this->artisan('agenda:gerar')->assertSuccessful();

        $this->assertSame(['2026-09-30 08:50', '2026-10-07 08:50', '2026-10-14 08:50', '2026-10-21 08:50', '2026-10-28 08:50', '2026-11-04 08:50', '2026-11-11 08:50', '2026-11-18 08:50', '2026-11-25 08:50', '2026-12-16 08:50'], $this->horarios($paciente));
    }

    public function test_janela_atravessa_virada_de_ano_e_respeita_inicio_futuro(): void
    {
        $this->travelTo(Carbon::parse('2026-12-28 10:00:00'));
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2)->assertSessionHasNoErrors();

        // Janela de 28/12/2026 a 10/01/2027.
        $this->assertSame(['2026-12-30 08:50', '2027-01-06 08:50', '2027-01-13 08:50', '2027-01-20 08:50', '2027-01-27 08:50', '2027-02-03 08:50', '2027-02-10 08:50', '2027-02-17 08:50', '2027-02-24 08:50'], $this->horarios($paciente));

        // Matrícula com início futuro só gera a partir do início.
        $matricula = $paciente->matriculas()->first();
        Consulta::query()->delete();
        $matricula->update(['inicio_da_matricula' => '2027-01-04']);
        $this->artisan('agenda:gerar')->assertSuccessful();
        $this->assertSame(['2027-01-06 08:50', '2027-01-13 08:50', '2027-01-20 08:50', '2027-01-27 08:50', '2027-02-03 08:50', '2027-02-10 08:50', '2027-02-17 08:50', '2027-02-24 08:50'], $this->horarios($paciente));
    }

    public function test_consulta_cancelada_da_matricula_nao_volta_quando_o_comando_roda(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $primeira = Consulta::where('paciente_id', $paciente->id)->orderBy('data_hora_consulta')->first();

        $this->patch("/agenda/{$primeira->id}/status", ['status' => 'cancelado'])->assertSessionHasNoErrors();
        $this->artisan('agenda:gerar');
        $this->artisan('agenda:gerar');

        $this->assertCount(8, $this->horarios($paciente, 'agendado'));
        $this->assertCount(1, $this->horarios($paciente, 'cancelado'));
    }

    public function test_agendamento_manual_em_horario_que_ja_passou_e_recusado(): void
    {
        $agendar = fn (string $date, string $hora) => $this->from('/agenda')->post('/agenda', [
            'patientId' => $this->paciente()->id,
            'date' => $date,
            'hora' => $hora,
            'tipo' => 'Consulta presencial',
            'status' => 'Agendado', 'valor' => 0,
            'valor' => 0,
        ]);

        // Agora é segunda, 28/09/2026 às 10:00.
        $agendar('2026-09-28', '08:50')->assertSessionHasErrors(['hora' => 'Esse horário já passou.']);
        $agendar('2026-09-25', '14:40')->assertSessionHasErrors(['hora' => 'Esse horário já passou.']);
        $agendar('2026-09-28', '10:30')->assertSessionHasNoErrors();

        $consulta = Consulta::sole();
        $this->assertSame('agendado', $consulta->status);
        $this->assertSame('Agendado', $consulta->rotuloStatus());
    }

    private function agendar(int $pacienteId, string $date, string $hora = '08:50')
    {
        return $this->from('/agenda')->post('/agenda', [
            'patientId' => $pacienteId, 'date' => $date, 'hora' => $hora, 'tipo' => 'Consulta online', 'status' => 'Agendado', 'valor' => 0,
        ]);
    }

    public function test_agendamento_manual_no_mesmo_horario_segue_o_limite(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $outro = $this->paciente(['nome' => 'Outro']);

        // Sem limite: outro paciente entra no mesmo horário.
        $this->agendar($outro->id, '2026-09-30')->assertSessionHasNoErrors();
        $this->assertSame(2, Consulta::where('data_hora_consulta', Carbon::parse('2026-09-30 08:50'))->count());

        // Com limite 2, o terceiro é recusado.
        $this->limitar(2);
        $this->agendar($this->paciente(['nome' => 'Terceiro'])->id, '2026-09-30')
            ->assertRedirect('/agenda')->assertSessionHasErrors(['hora' => 'Esse horário já atingiu o limite de 2 consultas simultâneas.']);
        $this->assertSame(2, Consulta::where('data_hora_consulta', Carbon::parse('2026-09-30 08:50'))->count());
    }

    public function test_mesmo_paciente_nunca_tem_duas_consultas_no_mesmo_horario(): void
    {
        $paciente = $this->paciente();
        $this->agendar($paciente->id, '2026-09-30')->assertSessionHasNoErrors();

        $this->agendar($paciente->id, '2026-09-30')
            ->assertSessionHasErrors(['hora' => 'Este paciente já tem consulta ou matrícula nesse horário.']);
    }

    public function test_avulsa_alem_da_janela_respeita_a_reserva_da_matricula_sem_gravar_a_ocorrencia(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $outro = $this->paciente(['nome' => 'Outro']);

        // 21/10 está fora da janela: a quarta da matrícula ainda não foi gravada, mas o horário é dela.
        $this->agendar($paciente->id, '2026-10-21')
            ->assertSessionHasErrors(['hora' => 'Este paciente já tem consulta ou matrícula nesse horário.']);

        $this->limitar(1);
        $this->agendar($outro->id, '2026-10-21')->assertSessionHasErrors(['hora' => 'Esse horário já tem consulta marcada.']);

        $this->limitar(null);
        $this->agendar($outro->id, '2026-10-21')->assertSessionHasNoErrors();

        // Nenhuma ocorrência da matrícula foi gravada por consultar a disponibilidade.
        $this->assertSame(['2026-09-30 08:50', '2026-10-07 08:50', '2026-10-14 08:50', '2026-10-21 08:50', '2026-10-28 08:50', '2026-11-04 08:50', '2026-11-11 08:50', '2026-11-18 08:50', '2026-11-25 08:50'], $this->horarios($paciente));
    }

    public function test_tela_recebe_os_horarios_lotados_pelo_limite(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $props = fn () => $this->get('/agenda?data=2026-10-21&visao=semana')->viewData('page')['props'];

        $this->assertSame([], $props()['fullSlots']);

        $this->limitar(1);
        // 30/09 (gravada) fora da semana; 21/10 é reserva da matrícula ainda não gravada.
        $this->assertSame(['2026-10-21' => ['08:50']], $props()['fullSlots']);
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
            'status' => 'Agendado', 'valor' => 0,
            'valor' => 0,
        ])->assertSessionHasErrors(['date' => 'Não há atendimento nesse dia da semana.']);

        $this->from('/agenda')->post('/agenda', [
            'patientId' => $paciente->id,
            'date' => '2026-09-30',
            'hora' => '09:00',
            'tipo' => 'Consulta presencial',
            'status' => 'Agendado', 'valor' => 0,
            'valor' => 0,
        ])->assertSessionHasErrors(['hora' => 'Esse horário está fora do expediente.']);
    }

    public function test_geracao_da_agenda_pula_dia_sem_atendimento(): void
    {
        $paciente = $this->paciente(['nome' => 'Carla Dias']);
        $this->matricular($paciente, weekday: 2, time: '08:50')->assertSessionHasNoErrors();

        // Simula um cadastro legado: a tela impede retirar dias com matrícula ativa.
        Configuracao::atual()->update(['dias_atendimento' => ['Seg', 'Ter']]);

        // Se limpar e tentar gerar com quarta fora dos dias de atendimento, não gera nenhuma consulta.
        Consulta::query()->delete();
        $this->artisan('agenda:gerar')->assertSuccessful();
        $this->get('/agenda?data=2026-12-23')->assertOk();
        $this->assertSame([], $this->horarios($paciente));
    }

    public function test_visoes_dia_semana_e_mes_devolvem_apenas_as_consultas_do_periodo(): void
    {
        $paciente = $this->paciente();
        // Quarta (30/09), Quinta (01/10) e outra semana de outubro (15/10).
        CriarConsulta::executar(['paciente_id' => $paciente->id, 'data_hora_consulta' => Carbon::parse('2026-09-30 08:50'), 'modalidade' => 'presencial']);
        CriarConsulta::executar(['paciente_id' => $paciente->id, 'data_hora_consulta' => Carbon::parse('2026-10-01 08:50'), 'modalidade' => 'presencial']);
        CriarConsulta::executar(['paciente_id' => $paciente->id, 'data_hora_consulta' => Carbon::parse('2026-10-15 08:50'), 'modalidade' => 'presencial']);

        $eventos = fn (string $url) => $this->get($url)->viewData('page')['props']['events'];

        $this->assertCount(1, $eventos('/agenda?data=2026-09-30&visao=dia'));
        $this->assertCount(2, $eventos('/agenda?data=2026-09-30&visao=semana'));
        $this->assertCount(2, $eventos('/agenda?data=2026-10-01&visao=mes'));
    }

    public function test_agenda_so_oferece_falta_e_cancelado_e_falta_vale_para_quem_tem_matricula(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $consulta = Consulta::where('paciente_id', $paciente->id)->orderBy('data_hora_consulta')->first();

        // Outros status não existem mais na agenda.
        foreach (['confirmado', 'realizado'] as $status) {
            $this->patchJson("/agenda/{$consulta->id}/status", ['status' => $status])
                ->assertStatus(422)
                ->assertJsonValidationErrors('status');
        }
        $this->assertSame('agendado', $consulta->fresh()->status);

        // Matriculado pode virar Falta direto.
        $this->patch("/agenda/{$consulta->id}/status", ['status' => 'falta'])->assertSessionHasNoErrors();
        $this->assertSame('falta', $consulta->fresh()->status);

        // Depois de cancelado, não pode mudar para mais nada.
        $this->patch("/agenda/{$consulta->id}/status", ['status' => 'cancelado'])->assertSessionHasNoErrors();
        $this->patchJson("/agenda/{$consulta->id}/status", ['status' => 'falta'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
        $this->assertSame('cancelado', $consulta->fresh()->status);
    }

    public function test_email_consulta_em_breve_mostra_matriculado_ou_agendado(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $matriculada = Consulta::where('paciente_id', $paciente->id)->first();

        $avulsa = CriarConsulta::executar([
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
