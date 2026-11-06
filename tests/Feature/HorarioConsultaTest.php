<?php

namespace Tests\Feature;

use App\Actions\CriarConsulta;
use App\Actions\CriarPaciente;
use App\Actions\InstalarConfiguracao;
use App\Models\Consulta;
use App\Services\HorarioConsulta;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class HorarioConsultaTest extends ConsultorioTestCase
{
    public function test_caso_de_uso_recusa_outro_paciente_no_mesmo_horario_sem_indice_global(): void
    {
        $this->limitar(1);
        $dados = ['data_hora_consulta' => '2026-09-30 08:50', 'modalidade' => 'online'];
        CriarConsulta::executar([...$dados, 'paciente_id' => $this->paciente()->id]);
        try {
            CriarConsulta::executar([...$dados, 'paciente_id' => $this->paciente()->id]);
            $this->fail('Com limite 1, o PHP mantém uma consulta por horário.');
        } catch (ValidationException $exception) {
            $this->assertSame(['hora' => ['Esse horário já tem consulta marcada.']], $exception->errors());
        }
        $this->assertDatabaseCount('agenda', 1);
        $this->assertNull(DB::selectOne("SELECT to_regclass('public.agenda_horario_unico') as name")->name);
        $this->assertNotNull(DB::selectOne("SELECT to_regclass('public.agenda_data_hora_consulta_index') as name")->name);
    }

    public function test_canceladas_podem_coexistir_e_liberam_o_horario_sem_recriar_a_ocorrencia(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2)->assertSessionHasNoErrors();
        $consulta = $paciente->consultas()->orderBy('data_hora_consulta')->first();
        $consulta->alterarStatus('cancelado');
        CriarConsulta::executar(['paciente_id' => $paciente->id, 'data_hora_consulta' => $consulta->data_hora_consulta,
            'modalidade' => 'online', 'status' => 'cancelado']);
        $outra = CriarConsulta::executar(['paciente_id' => $this->paciente()->id, 'data_hora_consulta' => $consulta->data_hora_consulta, 'modalidade' => 'online']);
        $this->artisan('agenda:gerar')->assertSuccessful();
        $this->assertSame(1, Consulta::where('data_hora_consulta', $consulta->data_hora_consulta)->where('status', '!=', 'cancelado')->count());
        $this->assertSame($outra->id, Consulta::where('data_hora_consulta', $consulta->data_hora_consulta)->where('status', '!=', 'cancelado')->value('id'));
        $this->assertSame(2, $paciente->consultas()->where('data_hora_consulta', $consulta->data_hora_consulta)->count());
    }

    public function test_bloqueio_considera_a_precisao_real_persistida_pelo_eloquent(): void
    {
        $this->limitar(1);
        $primeiro = Carbon::parse('2026-09-30 08:50:00.100000');
        $segundo = Carbon::parse('2026-09-30 08:50:00.900000');
        CriarConsulta::executar(['paciente_id' => $this->paciente()->id, 'data_hora_consulta' => $primeiro, 'modalidade' => 'online']);
        $this->expectException(ValidationException::class);
        CriarConsulta::executar(['paciente_id' => $this->paciente()->id, 'data_hora_consulta' => $segundo, 'modalidade' => 'online']);
    }

    public function test_criacao_historica_do_seeder_preserva_a_data_de_auditoria(): void
    {
        $data = Carbon::parse('2025-09-30 08:50:00');
        $consulta = CriarConsulta::executar(['paciente_id' => $this->paciente()->id, 'data_hora_consulta' => $data,
            'modalidade' => 'online', 'status' => 'realizado'], $data);
        $this->assertTrue($consulta->fresh()->criado_em->equalTo($data));
    }

    public function test_dois_escritores_reais_para_pacientes_diferentes_gravam_so_uma_consulta(): void
    {
        // Fora da transação de RefreshDatabase, para as duas conexões filhas
        // enxergarem os pacientes. Limpeza explícita e estritamente por IDs.
        $control = DB::build(config('database.connections.pgsql'));
        // Estatísticas observadas em autocommit: a transação que segura o lock
        // reutilizaria seu snapshot de pg_stat_activity e esconderia os filhos.
        $observer = DB::build(config('database.connections.pgsql'));
        $ids = [];
        $children = [];
        $configId = null;
        $tag = 'psystem-2a-'.bin2hex(random_bytes(6));
        $dataHora = '2031-03-03 08:50:00';
        try {
            // Os filhos não enxergam a configuração da transação do teste: limite 1 visível a eles.
            $configId = $control->table('configuracoes')->insertGetId(InstalarConfiguracao::dados(['consultas_simultaneas' => 1, 'dias_atendimento' => '["Seg"]']));
            foreach ([1, 2] as $number) {
                $ids[] = $control->table('pacientes')->insertGetId(CriarPaciente::dados([
                    'nome' => 'Concorrência sintética 2A '.$number, 'cpf' => '9980000000'.$number,
                    'telefone' => '00000000000', 'data_nascimento' => '1990-01-01',
                ]));
            }
            $control->beginTransaction();
            HorarioConsulta::bloquear($dataHora, $control);
            foreach ($ids as $id) {
                $pipes = [];
                $process = proc_open([PHP_BINARY, base_path('tests/Support/criar-consulta-concorrente.php'), (string) $id, $dataHora, $tag],
                    [0 => ['file', '/dev/null', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
                $this->assertIsResource($process);
                $children[] = ['process' => $process, 'pipes' => $pipes];
            }
            $deadline = microtime(true) + 15;
            do {
                $waiting = (int) $observer->selectOne('SELECT count(*) as total FROM pg_stat_activity WHERE application_name = ? AND wait_event = ?', [$tag, 'advisory'])->total;
                if ($waiting === 2) {
                    break;
                }
                usleep(20_000);
            } while (microtime(true) < $deadline);
            $diagnostic = '';
            if ($waiting !== 2) {
                foreach ($children as $child) {
                    stream_set_blocking($child['pipes'][2], false);
                    $diagnostic .= stream_get_contents($child['pipes'][2]);
                }
            }
            $this->assertSame(2, $waiting, 'Os dois escritores devem disputar o mesmo bloqueio antes da liberação. '.$diagnostic);
            $control->commit();
            $results = [];
            foreach ($children as &$child) {
                $output = stream_get_contents($child['pipes'][1]);
                $error = stream_get_contents($child['pipes'][2]);
                fclose($child['pipes'][1]);
                fclose($child['pipes'][2]);
                $exit = proc_close($child['process']);
                $child = null;
                $this->assertSame(0, $exit, $error);
                $results[] = json_decode(trim($output), true, flags: JSON_THROW_ON_ERROR);
            }
            unset($child);
            $statuses = array_column($results, 'status');
            sort($statuses);
            $this->assertSame(['created', 'rejected'], $statuses);
            $this->assertSame(1, $control->table('agenda')->whereIn('paciente_id', $ids)->count());
            $this->assertSame(['hora'], collect($results)->firstWhere('status', 'rejected')['fields']);
        } finally {
            if ($control->transactionLevel()) {
                $control->rollBack();
            }
            foreach ($children as $child) {
                if ($child && is_resource($child['process'])) {
                    proc_terminate($child['process']);
                    fclose($child['pipes'][1]);
                    fclose($child['pipes'][2]);
                    proc_close($child['process']);
                }
            }
            $control->table('agenda')->whereIn('paciente_id', $ids)->delete();
            $control->table('pacientes')->whereIn('id', $ids)->delete();
            $control->table('configuracoes')->where('id', $configId)->delete();
            $control->disconnect();
            $observer->disconnect();
        }
    }
}
