<?php

namespace Tests\Feature;

use App\Actions\CriarCobranca;
use App\Models\Configuracao;
use App\Models\Consulta;
use App\Models\Paciente;
use App\Models\Prontuario;
use App\Support\Tela;
use Illuminate\Database\QueryException;
use PHPUnit\Framework\Attributes\DataProvider;

class AjustesTest extends ConsultorioTestCase
{
    private function formularioConfig(array $horario = []): array
    {
        return [
            'perfil' => ['nome' => 'Dra. Teste', 'crp' => '12/00001', 'email' => 'teste@psystem.com'],
            'horario' => [...['dias' => ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'], 'inicio' => '08:00', 'fim' => '18:00', 'duracao' => 50], ...$horario],
            'goals' => ['faturamentoMensal' => 1000, 'horasSemanais' => 10, 'sessoesSemanais' => 10, 'novosPacientesMes' => 1],
        ];
    }

    public function test_cadastro_sem_historico_pode_ser_excluido(): void
    {
        $paciente = $this->paciente();
        $this->delete("/pacientes/{$paciente->id}")->assertRedirect('/pacientes')->assertSessionHasNoErrors();

        $this->assertSame(0, Paciente::count());
        $this->assertSame(0, Consulta::count());
        $this->assertDatabaseHas('registros_acao', ['acao' => 'paciente.excluir', 'alvo_id' => $paciente->id, 'psicologo_id' => $this->psicologa->id]);
    }

    /** @return array<string, array{callable}> */
    public static function historicos(): array
    {
        return [
            'atendimento realizado' => [fn ($t, $p) => Consulta::create(['paciente_id' => $p->id, 'data_hora_consulta' => '2026-09-21 08:50', 'duracao_minutos' => 50, 'modalidade' => 'presencial', 'status' => 'realizado'])],
            'prontuário' => [fn ($t, $p) => $p->prontuarios()->create(['psicologo_id' => $t->psicologa->id, 'data_atendimento' => '2026-09-01', 'observacoes_consulta' => 'x'])],
            'anamnese' => [fn ($t, $p) => $p->anamneses()->create(['psicologo_id' => $t->psicologa->id, 'titulo' => 'A'])],
            'documento' => [fn ($t, $p) => $p->documentos()->create(['titulo' => 'Doc', 'nome_arquivo' => 'a.pdf', 'caminho' => 'documentos/a.pdf', 'tamanho' => 1])],
            'cobrança' => [fn ($t, $p) => CriarCobranca::executar(['paciente_id' => $p->id, 'titulo' => 'Sessão', 'valor' => 200, 'vencimento' => '2026-10-10'])],
        ];
    }

    #[DataProvider('historicos')]
    public function test_cadastro_com_historico_nao_pode_ser_excluido(callable $criar): void
    {
        $paciente = $this->paciente();
        $criar($this, $paciente);

        $this->from('/pacientes')->delete("/pacientes/{$paciente->id}")->assertSessionHasErrors('paciente');

        $this->assertSame(1, Paciente::count());
    }

    public function test_banco_recusa_apagar_paciente_com_documento_por_outro_caminho(): void
    {
        $paciente = $this->paciente();
        $paciente->documentos()->create(['titulo' => 'Doc', 'nome_arquivo' => 'a.pdf', 'caminho' => 'documentos/a.pdf', 'tamanho' => 1]);

        $this->expectException(QueryException::class);
        $paciente->delete();
    }

    public function test_inativar_apaga_as_futuras_preserva_o_passado_e_registra_quem_fez(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $this->post('/agenda', ['patientId' => $paciente->id, 'date' => '2026-10-01', 'hora' => '10:30', 'tipo' => 'Consulta online', 'status' => 'Confirmado', 'valor' => 0])->assertSessionHasNoErrors();
        $passada = Consulta::create(['paciente_id' => $paciente->id, 'data_hora_consulta' => '2026-09-21 08:50', 'duracao_minutos' => 50, 'modalidade' => 'presencial', 'status' => 'realizado']);
        $paciente->prontuarios()->create(['psicologo_id' => $this->psicologa->id, 'data_atendimento' => '2026-09-21', 'observacoes_consulta' => 'x', 'agenda_id' => $passada->id]);

        $this->from("/pacientes/{$paciente->id}")->post("/pacientes/{$paciente->id}/inativar")->assertSessionHasNoErrors();

        $this->assertSame(['2026-09-21 08:50'], $this->horarios($paciente));
        $this->assertSame('inativo', $paciente->fresh()->status_paciente);
        $this->assertSame(['encerrada'], $paciente->matriculas()->pluck('status_matricula')->all());
        $this->assertSame(1, Prontuario::count());
        $this->assertDatabaseHas('registros_acao', ['acao' => 'paciente.inativar', 'alvo_id' => $paciente->id]);

        // Reativar (nova matrícula) não restaura nada: só gera a janela da matrícula nova.
        $this->matricular($paciente, weekday: 4)->assertSessionHasNoErrors();
        $this->assertSame(['2026-09-21 08:50', '2026-10-02 08:50', '2026-10-09 08:50', '2026-10-16 08:50', '2026-10-23 08:50', '2026-10-30 08:50', '2026-11-06 08:50', '2026-11-13 08:50', '2026-11-20 08:50', '2026-11-27 08:50'], $this->horarios($paciente));
    }

    public function test_inativar_e_recusado_se_consulta_futura_tem_cobranca_ou_prontuario(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $futura = $paciente->consultas()->orderBy('data_hora_consulta')->first();
        $paciente->prontuarios()->create(['psicologo_id' => $this->psicologa->id, 'data_atendimento' => '2026-09-30', 'observacoes_consulta' => 'x', 'agenda_id' => $futura->id]);

        $this->from("/pacientes/{$paciente->id}")->post("/pacientes/{$paciente->id}/inativar")
            ->assertSessionHasErrors(['paciente' => 'Não foi possível inativar: a(s) consulta(s) futura(s) de 30/09/2026 08:50 têm prontuário ou cobrança vinculados. Resolva essas consultas antes de inativar.']);

        $this->assertSame('ativo', $paciente->fresh()->status_paciente);
        $this->assertCount(9, $this->horarios($paciente));
    }

    public function test_excluir_prontuario(): void
    {
        $paciente = $this->paciente();
        $prontuario = $paciente->prontuarios()->create(['psicologo_id' => $this->psicologa->id, 'data_atendimento' => '2026-09-01', 'observacoes_consulta' => 'x']);

        $this->delete("/prontuarios/{$prontuario->id}")->assertRedirect();

        $this->assertSame(0, Prontuario::count());
    }

    public function test_cpf_repetido_avisa_que_ja_existe_paciente_com_ele(): void
    {
        $this->paciente(['cpf' => '52998224725']);

        $this->post('/pacientes', ['name' => 'Outra', 'cpf' => '529.982.247-25', 'nascimento' => '01/02/1990', 'phone' => '(48) 98888-0000'])
            ->assertSessionHasErrors(['cpf' => 'Já existe um paciente cadastrado com este CPF.']);
    }

    public function test_uf_aceita_so_duas_letras(): void
    {
        $base = ['name' => 'Ana', 'cpf' => '529.982.247-25', 'nascimento' => '01/02/1990', 'phone' => '(48) 98888-0000'];

        foreach (['SCX', 'S', '12', 'S1'] as $uf) {
            $this->post('/pacientes', [...$base, 'uf' => $uf])->assertSessionHasErrors('uf');
        }
        $this->assertSame(0, Paciente::count());

        $this->post('/pacientes', [...$base, 'uf' => 'sc'])->assertSessionHasNoErrors();
        $this->assertSame('SC', Paciente::sole()->endereco_uf);
    }

    public function test_telefone_chega_formatado_para_a_tela(): void
    {
        $this->assertSame('(48) 98836-4746', Tela::telefone('48988364746'));
        $this->assertSame('(48) 3333-4444', Tela::telefone('4833334444'));
        $this->assertSame('(48) 98836-4746', Tela::telefone('(48) 98836-4746'));
        $this->assertNull(Tela::telefone(null));
    }

    public function test_nao_deixa_tirar_dia_com_matricula_ativa(): void
    {
        $paciente = $this->paciente(['nome' => 'Maria']);
        $this->matricular($paciente, weekday: 2); // quarta

        $this->put('/configuracoes', $this->formularioConfig(['dias' => ['Seg', 'Ter', 'Qui', 'Sex']]))
            ->assertSessionHasErrors('horario.dias');

        $this->assertStringContainsString('Maria', session('errors')->first('horario.dias'));
        $this->assertContains('Qua', Configuracao::atual()->dias_atendimento);
    }

    public function test_nao_deixa_encurtar_expediente_sobre_horario_de_matricula(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2, time: '16:20')->assertSessionHasNoErrors();

        $this->put('/configuracoes', $this->formularioConfig(['fim' => '16:00']))->assertSessionHasErrors('horario.inicio');
    }

    public function test_tira_o_dia_depois_de_encerrar_a_matricula(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $this->delete('/matriculas/'.$paciente->matriculas()->first()->id);

        $this->put('/configuracoes', $this->formularioConfig(['dias' => ['Seg', 'Ter', 'Qui', 'Sex']]))->assertSessionHasNoErrors();
    }

    public function test_salva_configuracoes_com_matricula_em_horario_fracionado(): void
    {
        $this->matricular($this->paciente(), weekday: 2)->assertSessionHasNoErrors();

        $this->put('/configuracoes', $this->formularioConfig())->assertSessionHasNoErrors();
    }

    public function test_pausa_de_almoco_nao_pode_cobrir_matricula_ativa(): void
    {
        $this->matricular($this->paciente(), weekday: 2, time: '12:10')->assertSessionHasNoErrors();

        $this->put('/configuracoes', $this->formularioConfig(['almocoInicio' => '12:00', 'almocoFim' => '13:00']))
            ->assertSessionHasErrors('horario.inicio');
    }

    public function test_mes_alem_da_janela_mostra_so_consultas_gravadas_e_informa_o_limite(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2)->assertSessionHasNoErrors();

        $props = $this->get('/agenda?data=2027-01-05&visao=dia')->assertOk()->viewData('page')['props'];

        // A matrícula não vira consulta só por abrir o mês; a tela informa até quando há consultas geradas.
        $this->assertSame([], $props['events']);
        $this->assertSame('2026-11-28', $props['agendaWindow']['ate']);
        $this->assertSame(62, $props['agendaWindow']['dias']);
    }

    public function test_matricula_encerrada_nao_volta_para_a_agenda(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $this->delete('/matriculas/'.$paciente->matriculas()->first()->id);

        $this->get('/agenda?data=2026-11-18')->assertOk();

        $this->assertNotContains('2026-11-18 08:50', $this->horarios($paciente));
    }

    public function test_horarios_invalidos_tem_mensagens_em_portugues(): void
    {
        $this->put('/configuracoes', $this->formularioConfig(['inicio' => '25:00', 'almocoInicio' => '12:', 'almocoFim' => null]))
            ->assertSessionHasErrors([
                'horario.inicio' => 'Informe um horário válido no formato HH:MM (entre 00:00 e 23:59).',
                'horario.almocoFim' => 'Preencha o término da pausa, ou deixe os dois horários da pausa em branco.',
            ]);

        $this->put('/configuracoes', $this->formularioConfig(['almocoInicio' => '13:00', 'almocoFim' => '12:00']))
            ->assertSessionHasErrors(['horario.almocoFim' => 'O término da pausa precisa ser depois do início da pausa.']);
    }
}
