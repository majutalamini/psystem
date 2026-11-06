<?php

namespace Tests\Feature;

use App\Actions\CriarConsulta;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class PostgresTest extends ConsultorioTestCase
{
    public function test_conexao_real_usa_postgres_com_fuso_do_consultorio(): void
    {
        $this->assertSame('pgsql', DB::connection()->getDriverName());
        $this->assertSame('psystem_test', DB::selectOne('select current_database() as name')->name);
        $this->assertSame('America/Sao_Paulo', DB::selectOne('show timezone')->TimeZone);
    }

    public function test_indice_parcial_protege_paciente_horario_sem_impor_a_regra_global(): void
    {
        // SQL direto intencional: prova a proteção estrutural, sem passar pelo PHP.
        $dados = CriarConsulta::dados(['paciente_id' => $this->paciente()->id, 'data_hora_consulta' => '2026-09-30 08:50:00', 'modalidade' => 'online']);
        DB::table('agenda')->insert($dados);
        DB::table('agenda')->insert([...$dados, 'status' => 'cancelado']);

        try {
            DB::transaction(fn () => DB::table('agenda')->insert($dados));
            $this->fail('O índice parcial deveria recusar o mesmo paciente/horário.');
        } catch (QueryException $e) {
            $this->assertSame('23505', $e->errorInfo[0]);
        }
        DB::table('agenda')->insert([...$dados, 'paciente_id' => $this->paciente()->id]);
        $this->assertDatabaseCount('agenda', 3);
    }

    public function test_check_do_enum_recusa_status_desconhecido(): void
    {
        try {
            DB::transaction(fn () => CriarConsulta::executar([
                'paciente_id' => $this->paciente()->id,
                'data_hora_consulta' => '2026-09-30 08:50:00',
                'modalidade' => 'online', 'status' => 'inexistente',
            ]));
            $this->fail('O CHECK deveria recusar o status.');
        } catch (QueryException $e) {
            $this->assertSame('23514', $e->errorInfo[0]);
        }
    }

    public function test_for_update_bloqueia_segunda_conexao(): void
    {
        // Linha criada fora da transação de RefreshDatabase para ser visível nas duas conexões.
        $config = config('database.connections.pgsql');
        $first = DB::build($config);
        $second = DB::build($config);
        $id = $first->table('cache')->insertGetId(['key' => 'lock-probe', 'value' => 'synthetic', 'expiration' => 0], 'key');
        try {
            $first->beginTransaction();
            $first->table('cache')->where('key', $id)->lockForUpdate()->first();
            try {
                $second->table('cache')->where('key', $id)->lock('FOR UPDATE NOWAIT')->first();
                $this->fail('A segunda conexão deveria encontrar o bloqueio.');
            } catch (QueryException $e) {
                $this->assertSame('55P03', $e->errorInfo[0]);
            }
        } finally {
            $first->rollBack();
            $first->table('cache')->where('key', $id)->delete();
            $first->disconnect();
            $second->disconnect();
        }
    }
}
