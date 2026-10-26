<?php

namespace Tests\Feature;

use App\Models\Paciente;

class PacienteTest extends ConsultorioTestCase
{
    private function formulario(array $dados = []): array
    {
        return [
            'name' => 'Nova Paciente',
            'cpf' => '123.456.789-09',
            'nascimento' => '01/02/1990',
            'phone' => '(48) 98888-0000',
            ...$dados,
        ];
    }

    public function test_cpf_com_digito_verificador_errado_e_recusado(): void
    {
        $this->post('/pacientes', $this->formulario(['cpf' => '123.456.789-00']))
            ->assertSessionHasErrors(['cpf' => 'O CPF informado é inválido.']);
        $this->post('/pacientes', $this->formulario(['cpf' => '111.111.111-11']))->assertSessionHasErrors('cpf');

        $this->assertSame(0, Paciente::count());
    }

    public function test_cpf_valido_e_aceito_com_ou_sem_mascara(): void
    {
        $this->post('/pacientes', $this->formulario())->assertSessionHasNoErrors();
        $this->post('/pacientes', $this->formulario(['cpf' => '52998224725']))->assertSessionHasNoErrors();

        $this->assertSame(2, Paciente::count());
    }

    public function test_data_de_nascimento_futura_e_recusada_e_hoje_e_aceito(): void
    {
        $this->post('/pacientes', $this->formulario(['nascimento' => '29/09/2026']))
            ->assertSessionHasErrors(['nascimento' => 'A data de nascimento não pode ser futura.']);
        $this->post('/pacientes', $this->formulario(['nascimento' => '28/09/2026']))->assertSessionHasNoErrors();
    }

    public function test_paciente_novo_nasce_inativo_ate_ter_matricula(): void
    {
        $this->post('/pacientes', $this->formulario())->assertSessionHasNoErrors();
        $paciente = Paciente::sole();
        $this->assertSame('inativo', $paciente->status_paciente);

        $this->matricular($paciente, weekday: 2);
        $this->assertSame('ativo', $paciente->fresh()->status_paciente);
    }

    public function test_editar_cadastro_nao_muda_status_nem_sexo(): void
    {
        $paciente = $this->paciente(['sexo' => 'feminino']);
        $this->matricular($paciente, weekday: 2);

        $this->put("/pacientes/{$paciente->id}", $this->formulario(['cpf' => '52998224725', 'status' => 'Inativo', 'sexo' => 'masculino']))
            ->assertSessionHasNoErrors();

        $paciente->refresh();
        $this->assertSame('ativo', $paciente->status_paciente);
        $this->assertSame('feminino', $paciente->sexo);
        $this->assertSame('Nova Paciente', $paciente->nome);
    }

    public function test_paciente_pode_ter_varias_matriculas_e_a_tela_recebe_a_lista(): void
    {
        $paciente = $this->paciente();

        $this->matricular($paciente, weekday: 2, valor: 200)->assertSessionHasNoErrors();
        $this->matricular($paciente, weekday: 4, time: '14:00', valor: 150)->assertSessionHasNoErrors();

        $this->assertSame(2, $paciente->matriculas()->ativas()->count());
        $this->assertCount(8, $this->horarios($paciente));

        $tela = Paciente::comResumo()->find($paciente->id)->paraTela();
        $this->assertSame([200.0, 150.0], array_column($tela['matriculas']->all(), 'valor'));
        $this->assertSame(['ativa', 'ativa'], array_column($tela['matriculas']->all(), 'status'));
    }

    public function test_mesmo_dia_e_horario_na_mesma_paciente_e_recusado_mas_editar_sem_mudar_o_horario_nao(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);

        $this->matricular($paciente, weekday: 2)
            ->assertSessionHasErrors(['time' => 'Esse horário já é de outra matrícula deste paciente.']);
        $this->assertSame(1, $paciente->matriculas()->count());

        $this->alterarMatricula($paciente->matriculas()->first(), weekday: 2, valor: 300)->assertSessionHasNoErrors();
        $this->assertEquals(300, $paciente->matriculas()->first()->valor_sessao);
    }

    public function test_encerrar_uma_de_duas_matriculas_mantem_o_paciente_ativo_e_a_ultima_inativa(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $this->matricular($paciente, weekday: 4);
        [$primeira, $segunda] = $paciente->matriculas()->orderBy('id')->get()->all();

        $this->delete("/matriculas/{$primeira->id}");
        $this->assertSame('ativo', $paciente->fresh()->status_paciente);
        $this->assertCount(4, $this->horarios($paciente));

        $this->delete("/matriculas/{$segunda->id}");
        $this->assertSame('inativo', $paciente->fresh()->status_paciente);
        $this->assertSame([], $this->horarios($paciente));
    }

    public function test_matricula_encerrada_nao_pode_ser_alterada(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $matricula = $paciente->matriculas()->first();
        $this->delete("/matriculas/{$matricula->id}");

        $this->alterarMatricula($matricula, weekday: 3)->assertSessionHasErrors('time');
        $this->assertSame('quarta-feira', $matricula->fresh()->dia_da_matricula);
    }

    public function test_comando_acerta_o_status_dos_pacientes_ja_cadastrados(): void
    {
        $semMatricula = $this->paciente(['status_paciente' => 'ativo']);
        $comMatricula = $this->paciente(['status_paciente' => 'inativo']);
        $comMatricula->matriculas()->create([
            'inicio_da_matricula' => today(), 'dia_da_matricula' => 'quarta-feira', 'horario_da_matricula' => '09:00',
            'tipo_da_consulta' => 'presencial', 'valor_sessao' => 200,
        ]);

        $this->artisan('pacientes:sincronizar-status')->assertSuccessful();

        $this->assertSame('inativo', $semMatricula->fresh()->status_paciente);
        $this->assertSame('ativo', $comMatricula->fresh()->status_paciente);
    }
}
