<?php

namespace Tests\Feature;

use App\Models\Paciente;
use App\Models\Responsavel;

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
        // Nascido hoje é menor de idade: precisa de responsável.
        $responsavel = Responsavel::create(['nome' => 'Mãe', 'telefone' => '(48) 90000-0000']);
        $this->post('/pacientes', $this->formulario(['nascimento' => '28/09/2026', 'responsavelId' => $responsavel->id]))->assertSessionHasNoErrors();
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

        $this->matricular($paciente, weekday: 2, valor: 350)->assertSessionHasNoErrors();
        $this->matricular($paciente, weekday: 4, time: '13:50')->assertSessionHasNoErrors();

        $this->assertSame(2, $paciente->matriculas()->ativas()->count());
        $this->assertSame(1, $paciente->contratos()->count(), 'o segundo horário entra no mesmo contrato');
        $this->assertCount(18, $this->horarios($paciente));

        $tela = Paciente::comResumo()->find($paciente->id)->paraTela();
        $this->assertSame([2, 4], array_column($tela['matriculas']->all(), 'weekday'));
        $this->assertSame(['ativa', 'ativa'], array_column($tela['matriculas']->all(), 'status'));
        $this->assertSame(350.0, $tela['contrato']['valor']);
    }

    public function test_mesmo_dia_e_horario_na_mesma_paciente_e_recusado_mas_editar_sem_mudar_o_horario_nao(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);

        $this->matricular($paciente, weekday: 2)
            ->assertSessionHasErrors(['time' => 'Esse horário já é de outra matrícula deste paciente.']);
        $this->assertSame(1, $paciente->matriculas()->count());

        $this->alterarMatricula($paciente->matriculas()->first(), weekday: 2)->assertSessionHasNoErrors();
    }

    public function test_tirar_um_de_dois_horarios_mantem_o_contrato_e_o_ultimo_nao_pode_sair(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $this->matricular($paciente, weekday: 4);
        [$primeira, $segunda] = $paciente->matriculas()->orderBy('id')->get()->all();

        $this->delete("/matriculas/{$primeira->id}");
        $this->assertSame('ativo', $paciente->fresh()->status_paciente);
        $this->assertCount(9, $this->horarios($paciente));

        // O contrato precisa de ao menos um horário: para parar, encerra-se o contrato.
        $this->from("/pacientes/{$paciente->id}")->delete("/matriculas/{$segunda->id}")->assertSessionHasErrors('matricula');
        $this->assertSame('ativa', $segunda->fresh()->status_matricula);

        $this->encerrarContrato($paciente);
        $this->assertSame('inativo', $paciente->fresh()->status_paciente);
        $this->assertSame([], $this->horarios($paciente));
    }

    public function test_matricula_encerrada_nao_pode_ser_alterada(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $matricula = $paciente->matriculas()->first();
        $this->encerrarContrato($paciente);

        $this->alterarMatricula($matricula, weekday: 3)->assertSessionHasErrors('time');
        $this->assertSame('quarta-feira', $matricula->fresh()->dia_da_matricula);
    }

    public function test_comando_acerta_o_status_dos_pacientes_ja_cadastrados(): void
    {
        $semContrato = $this->paciente(['status_paciente' => 'ativo']);
        $comContrato = $this->paciente(['status_paciente' => 'inativo']);
        $bloqueado = $this->paciente(['status_paciente' => 'ativo']);
        foreach ([[$comContrato, 'ativo'], [$bloqueado, 'bloqueado']] as [$p, $status]) {
            $p->contratos()->create([
                'sessoes_pacote' => 4, 'valor_pacote' => 200, 'data_inicio' => today(), 'ciclo_inicio' => today(), 'status' => $status,
            ]);
        }

        $this->artisan('pacientes:sincronizar-status')->assertSuccessful();

        $this->assertSame('inativo', $semContrato->fresh()->status_paciente);
        $this->assertSame('ativo', $comContrato->fresh()->status_paciente);
        $this->assertSame('bloqueado', $bloqueado->fresh()->status_paciente);
    }
}
