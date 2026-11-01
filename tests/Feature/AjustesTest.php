<?php

namespace Tests\Feature;

use App\Models\Cobranca;
use App\Models\Consulta;
use App\Models\Paciente;
use App\Models\Prontuario;
use App\Support\Tela;
use Illuminate\Support\Carbon;

class AjustesTest extends ConsultorioTestCase
{
    private function formularioConfig(array $horario = []): array
    {
        return [
            'perfil' => ['nome' => 'Dra. Teste', 'crp' => '12/00001', 'email' => 'teste@psystem.com'],
            'horario' => [...['dias' => ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'], 'inicio' => '08:00', 'fim' => '18:00', 'duracao' => 50], ...$horario],
            'goals' => ['faturamentoMensal' => 1000, 'horasSemanais' => 10, 'sessoesSemanais' => 10, 'novosPacientesMes' => 1],
            'whatsapp' => ['enabled' => false, 'diasAntes' => 2],
        ];
    }

    public function test_excluir_cadastro_apaga_o_paciente_e_tudo_o_que_era_dele(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $paciente->prontuarios()->create(['psicologo_id' => $this->psicologa->id, 'data_atendimento' => '2026-09-01', 'observacoes_consulta' => 'x']);
        $paciente->cobrancas()->create(['titulo' => 'Sessão', 'valor' => 200, 'vencimento' => '2026-10-10']);

        $this->delete("/pacientes/{$paciente->id}")->assertRedirect('/pacientes');

        $this->assertSame(0, Paciente::count());
        $this->assertSame(0, Consulta::count());
        $this->assertSame(0, Prontuario::count());
        $this->assertSame(0, Cobranca::count());
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
        $this->assertContains('Qua', \App\Models\Configuracao::atual()->dias_atendimento);
    }

    public function test_nao_deixa_encurtar_expediente_sobre_horario_de_matricula(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2, time: '16:00');

        $this->put('/configuracoes', $this->formularioConfig(['fim' => '16:00']))->assertSessionHasErrors('horario.inicio');
    }

    public function test_tira_o_dia_depois_de_encerrar_a_matricula(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $this->delete('/matriculas/'.$paciente->matriculas()->first()->id);

        $this->put('/configuracoes', $this->formularioConfig(['dias' => ['Seg', 'Ter', 'Qui', 'Sex']]))->assertSessionHasNoErrors();
    }

    public function test_matricula_aparece_em_qualquer_semana_aberta_na_agenda(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2); // quartas

        // Três meses à frente, bem além das 4 semanas geradas na hora.
        $this->get('/agenda?data=2026-12-23')->assertOk();

        $this->assertContains('2026-12-23 09:00', $this->horarios($paciente));
    }

    public function test_matricula_encerrada_nao_volta_para_a_agenda(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $this->delete('/matriculas/'.$paciente->matriculas()->first()->id);

        $this->get('/agenda?data=2026-12-23')->assertOk();

        $this->assertNotContains('2026-12-23 09:00', $this->horarios($paciente));
    }
}
