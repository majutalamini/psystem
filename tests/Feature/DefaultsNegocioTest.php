<?php

namespace Tests\Feature;

use App\Actions\CriarPaciente;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class DefaultsNegocioTest extends ConsultorioTestCase
{
    public function test_colunas_de_estado_inicial_continuam_obrigatorias_sem_default_sql(): void
    {
        foreach ([
            'pacientes' => ['status_paciente'], 'agenda' => ['status', 'duracao_minutos'],
            'matriculas' => ['status_matricula'], 'cobrancas' => ['situacao'],
            'pagamentos' => ['data_pagamento'],
            'configuracoes' => ['meta_faturamento_mensal', 'meta_horas_semanais', 'meta_sessoes_semanais',
                'meta_novos_pacientes_mes', 'expediente_inicio', 'expediente_fim', 'duracao_sessao', 'intervalo_sessao'],
        ] as $table => $columns) {
            foreach ($columns as $column) {
                $definition = DB::selectOne('SELECT is_nullable, column_default FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?', ['public', $table, $column]);
                $this->assertNotNull($definition, "{$table}.{$column}");
                $this->assertSame('NO', $definition->is_nullable, "{$table}.{$column}");
                $this->assertNull($definition->column_default, "{$table}.{$column}");
            }
        }
    }

    public function test_escritor_sql_que_esquece_estado_falha_e_caso_de_uso_define_inativo(): void
    {
        $dados = ['nome' => 'Estado explícito', 'cpf' => '52998224725', 'telefone' => '00000000000', 'data_nascimento' => '1990-01-01'];
        try {
            DB::transaction(fn () => DB::table('pacientes')->insert($dados));
            $this->fail('Uma inserção sem estado deveria falhar por NOT NULL.');
        } catch (QueryException $exception) {
            $this->assertSame('23502', $exception->errorInfo[0]);
        }
        $paciente = CriarPaciente::executar($dados);
        $this->assertSame('inativo', $paciente->fresh()->status_paciente);
    }
}
