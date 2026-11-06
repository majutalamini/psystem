<?php

namespace Tests\Feature;

use App\Actions\RevogarConta;
use App\Notifications\ConsultaEmBreve;
use App\Notifications\ContasAVencer;
use App\Notifications\RedefinirSenha;
use App\Support\Prontidao;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

/** Etapa 4: identificação e log das requisições, prontidão, Pulse e fila. */
class OperacaoTest extends ConsultorioTestCase
{
    private function ultimaLinhaDoLog(): array
    {
        // O nome do arquivo diário usa a data real do relógio do sistema (não a data simulada pelo teste).
        $arquivos = glob(storage_path('logs/requisicoes-*.log'));
        usort($arquivos, fn ($a, $b) => filemtime($b) <=> filemtime($a));
        $linhas = array_values(array_filter(explode("\n", (string) file_get_contents($arquivos[0]))));

        return json_decode(end($linhas), true, flags: JSON_THROW_ON_ERROR);
    }

    public function test_requisicao_recebe_identificador_e_log_registra_so_o_padrao_da_rota(): void
    {
        $paciente = $this->paciente(['nome' => 'Nome Que Não Pode Ir Ao Log']);

        $resposta = $this->get("/pacientes/{$paciente->id}?q=segredo-na-url")->assertOk();
        $id = $resposta->headers->get('X-Request-ID');
        $this->assertMatchesRegularExpression('/^[0-9a-f-]{36}$/', $id);

        $linha = $this->ultimaLinhaDoLog();
        $this->assertSame($id, $linha['context']['request_id'] ?? null);
        $this->assertSame('pacientes/{paciente}', $linha['context']['rota']);
        $this->assertSame(200, $linha['context']['status']);
        $this->assertGreaterThan(0, $linha['context']['consultas']);
        $texto = json_encode($linha, JSON_UNESCAPED_UNICODE);
        $this->assertStringNotContainsString('segredo-na-url', $texto);
        $this->assertStringNotContainsString('Nome Que Não Pode', $texto);
        $this->assertStringNotContainsString((string) $paciente->id.'?', $texto);
    }

    public function test_identificador_valido_do_proxy_e_mantido_e_invalido_e_trocado(): void
    {
        $this->get('/agenda', ['X-Request-ID' => 'proxy-abc12345'])->assertHeader('X-Request-ID', 'proxy-abc12345');
        $outro = $this->get('/agenda', ['X-Request-ID' => "<script>\n"])->headers->get('X-Request-ID');
        $this->assertMatchesRegularExpression('/^[0-9a-f-]{36}$/', $outro);
    }

    public function test_prontidao_separa_falha_critica_de_alerta_e_nao_expoe_detalhes(): void
    {
        Storage::fake('local');
        Auth::logout();

        $resposta = $this->get('/prontidao')->assertOk();
        $this->assertSame('pronto', $resposta->json('status'));
        $this->assertSame(['banco' => 'ok', 'armazenamento' => 'ok', 'scheduler' => 'falha', 'fila' => 'ok', 'backup' => 'falha'], $resposta->json('verificacoes'));
        $this->assertSame(['scheduler', 'backup'], $resposta->json('alertas'));

        Cache::put(Prontidao::BATIMENTO_SCHEDULER, now()->toIso8601String());
        Storage::put(Prontidao::ARQUIVO_BACKUP, json_encode(['concluido_em' => now()->subHours(3)->toIso8601String(), 'externo' => false]));
        $this->assertSame(['backup'], $this->get('/prontidao')->json('alertas')); // sem cópia externa ainda é alerta

        Storage::put(Prontidao::ARQUIVO_BACKUP, json_encode(['concluido_em' => now()->subHours(3)->toIso8601String(), 'externo' => true]));
        $this->assertSame([], $this->get('/prontidao')->json('alertas'));

        Storage::put(Prontidao::ARQUIVO_BACKUP, json_encode(['concluido_em' => now()->subHours(30)->toIso8601String(), 'externo' => true]));
        $this->assertSame(['backup'], $this->get('/prontidao')->json('alertas'));
    }

    public function test_comando_de_status_mostra_banco_e_arquivos(): void
    {
        Storage::fake('local');
        $this->artisan('operacao:status')->expectsOutputToContain('banco')->expectsOutputToContain('livre no disco')->assertSuccessful();
    }

    public function test_painel_do_pulse_exige_login_e_conta_ativa(): void
    {
        $this->get('/pulse')->assertOk();

        RevogarConta::revogar($this->psicologa);
        $this->actingAs($this->psicologa->fresh());
        $this->get('/pulse')->assertRedirect('/login'); // ContaAtiva derruba a sessão revogada antes do painel

        Auth::logout();
        $this->get('/pulse')->assertRedirect('/login');
    }

    public function test_emails_vao_para_a_fila_com_tentativas_limitadas(): void
    {
        foreach ([ConsultaEmBreve::class, ContasAVencer::class, RedefinirSenha::class] as $classe) {
            $this->assertTrue(is_subclass_of($classe, ShouldQueue::class), $classe);
            $this->assertSame(3, (new \ReflectionClass($classe))->getProperty('tries')->getDefaultValue());
        }
    }
}
