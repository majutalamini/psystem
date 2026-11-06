<?php

namespace Tests\Feature;

use App\Actions\CriarCobranca;
use App\Actions\CriarPaciente;
use App\Models\Cobranca;
use App\Models\Consulta;
use App\Models\Despesa;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Etapa 2B: recebimentos excessivos, baixas duplicadas e cobranças duplicadas sob disputa. */
class ConcorrenciaFinanceiraTest extends ConsultorioTestCase
{
    private function baixa(array $dados = []): array
    {
        return ['data' => '28/09/2026', 'valor' => 100, 'forma' => 'Pix', ...$dados];
    }

    public function test_despesa_ja_paga_nao_e_paga_de_novo(): void
    {
        $despesa = Despesa::create(['descricao' => 'Aluguel', 'categoria' => 'Estrutura', 'valor' => 100, 'vencimento' => '2026-10-01']);

        $this->post("/despesas/{$despesa->id}/pagamento", $this->baixa())->assertSessionHasNoErrors();
        $this->post("/despesas/{$despesa->id}/pagamento", $this->baixa(['valor' => 50]))
            ->assertSessionHasErrors(['valor' => 'Esta despesa já foi paga.']);

        $this->assertEquals(100, $despesa->fresh()->pago());
        $this->assertSame(1, $despesa->pagamentos()->count());
        $this->assertDatabaseHas('registros_acao', ['acao' => 'despesa.pagar', 'alvo_id' => $despesa->id]);
    }

    public function test_cobranca_cancelada_nao_recebe(): void
    {
        $cobranca = CriarCobranca::executar(['paciente_id' => $this->paciente()->id, 'titulo' => 'X', 'valor' => 100, 'vencimento' => '2026-10-01', 'situacao' => 'cancelado']);

        $this->post("/cobrancas/{$cobranca->id}/pagamento", $this->baixa())
            ->assertSessionHasErrors(['valor' => 'Esta cobrança foi cancelada e não pode ser recebida.']);
        $this->assertSame(0, $cobranca->pagamentos()->count());
    }

    public function test_banco_impede_duas_cobrancas_para_a_mesma_consulta(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $consulta = $paciente->consultas()->first();
        CriarCobranca::executar(['agenda_id' => $consulta->id, 'paciente_id' => $paciente->id, 'titulo' => 'Avulsa', 'valor' => 1, 'vencimento' => '2026-09-30']);
        $this->assertSame(1, Cobranca::where('agenda_id', $consulta->id)->count());

        $this->expectException(UniqueConstraintViolationException::class);
        CriarCobranca::executar(['agenda_id' => $consulta->id, 'paciente_id' => $paciente->id, 'titulo' => 'Duplicada', 'valor' => 1, 'vencimento' => '2026-09-30']);
    }

    public function test_status_e_conferido_sobre_a_linha_atual_e_nao_sobre_a_copia_antiga(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 2);
        $copiaAntiga = Consulta::where('paciente_id', $paciente->id)->first(); // ainda "agendado"
        Consulta::whereKey($copiaAntiga->id)->update(['status' => 'cancelado']); // outra pessoa cancelou

        $this->expectException(ValidationException::class);
        $copiaAntiga->alterarStatus('realizado');
    }

    public function test_dois_recebimentos_reais_do_saldo_inteiro_gravam_so_um(): void
    {
        // Fora da transação de RefreshDatabase, para os dois processos enxergarem a cobrança.
        $control = DB::build(config('database.connections.pgsql'));
        $observer = DB::build(config('database.connections.pgsql'));
        $pacienteId = $cobrancaId = null;
        $children = [];
        $tag = 'psystem-2b-'.bin2hex(random_bytes(6));
        try {
            $pacienteId = $control->table('pacientes')->insertGetId(CriarPaciente::dados([
                'nome' => 'Concorrência sintética 2B', 'cpf' => '99700000001', 'telefone' => '00000000000', 'data_nascimento' => '1990-01-01',
            ]));
            $cobrancaId = $control->table('cobrancas')->insertGetId(CriarCobranca::dados([
                'paciente_id' => $pacienteId, 'titulo' => 'Disputa', 'valor' => 100, 'vencimento' => '2026-10-01', 'criado_em' => now(),
            ]));

            // Segura a cobrança: os dois recebimentos ficam esperando o mesmo bloqueio de linha.
            $control->beginTransaction();
            $control->selectOne('SELECT id FROM cobrancas WHERE id = ? FOR UPDATE', [$cobrancaId]);
            foreach ([1, 2] as $_) {
                $pipes = [];
                $process = proc_open([PHP_BINARY, base_path('tests/Support/receber-cobranca-concorrente.php'), (string) $cobrancaId, '100', $tag],
                    [0 => ['file', '/dev/null', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
                $this->assertIsResource($process);
                $children[] = ['process' => $process, 'pipes' => $pipes];
            }
            $deadline = microtime(true) + 15;
            do {
                $waiting = (int) $observer->selectOne("SELECT count(*) AS total FROM pg_stat_activity WHERE application_name = ? AND wait_event_type = 'Lock'", [$tag])->total;
                if ($waiting === 2) {
                    break;
                }
                usleep(20_000);
            } while (microtime(true) < $deadline);
            $this->assertSame(2, $waiting, 'Os dois recebimentos devem disputar a mesma cobrança antes da liberação.');
            $control->commit();

            $results = [];
            foreach ($children as &$child) {
                $output = stream_get_contents($child['pipes'][1]);
                $error = stream_get_contents($child['pipes'][2]);
                fclose($child['pipes'][1]);
                fclose($child['pipes'][2]);
                $this->assertSame(0, proc_close($child['process']), $error);
                $child = null;
                $results[] = json_decode(trim($output), true, flags: JSON_THROW_ON_ERROR);
            }
            unset($child);
            $statuses = array_column($results, 'status');
            sort($statuses);
            $this->assertSame(['created', 'rejected'], $statuses);
            $this->assertSame(1, $control->table('pagamentos')->where('cobranca_id', $cobrancaId)->count());
            $this->assertSame('pago', $control->table('cobrancas')->where('id', $cobrancaId)->value('situacao'));
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
            $control->table('pagamentos')->where('cobranca_id', $cobrancaId)->delete();
            $control->table('cobrancas')->where('id', $cobrancaId)->delete();
            $control->table('pacientes')->where('id', $pacienteId)->delete();
            $control->disconnect();
            $observer->disconnect();
        }
    }
}
