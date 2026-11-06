<?php

namespace Tests\Feature;

use App\Http\Middleware\MeasureRequest;
use App\Support\RequestMetrics;
use Database\Seeders\DiagnosticoSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DiagnosticsTest extends ConsultorioTestCase
{
    public function test_identificador_do_laboratorio_nao_abre_no_banco_normal(): void
    {
        config(['diagnostics.enabled' => true]);
        $this->withHeader('X-Psystem-Diagnostics', '1')->get('/__diagnostico')->assertNotFound();
    }

    public function test_seeder_sintetico_recusa_outro_banco_antes_de_gravar(): void
    {
        if (! is_file(database_path('seeders/DiagnosticoSeeder.php'))) {
            $this->markTestSkipped('A seed sintética do laboratório é local e não é versionada.');
        }

        $before = DB::table('psicologos')->count();
        try {
            $this->seed(DiagnosticoSeeder::class);
            $this->fail('O seeder deveria recusar psystem_test.');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('psystem_diagnostic', $e->getMessage());
        }
        $this->assertSame($before, DB::table('psicologos')->count());
        $this->assertDatabaseCount('pacientes', 0);
    }

    public function test_diagnostico_desligado_nao_expoe_medicoes(): void
    {
        $this->withHeader('X-Psystem-Diagnostics', '1')->get('/agenda')
            ->assertOk()->assertHeaderMissing('Server-Timing')->assertHeaderMissing('X-Psystem-Sql-Count');
    }

    public function test_cookie_do_laboratorio_nao_habilita_metricas_em_outro_banco(): void
    {
        config(['diagnostics.enabled' => true]);
        $this->withUnencryptedCookie('__psystem_metrics', '1')->get('/agenda')
            ->assertOk()->assertHeaderMissing('Server-Timing');
    }

    public function test_coletor_e_desativado_quando_a_requisicao_lanca_excecao(): void
    {
        config(['diagnostics.enabled' => true]);
        $request = Request::create('/agenda');
        $request->headers->set('X-Psystem-Diagnostics', '1');
        try {
            app(MeasureRequest::class)->handle($request, function () {
                throw new \RuntimeException('Falha sintética');
            });
            $this->fail('A falha deveria ser propagada.');
        } catch (\RuntimeException $e) {
            $this->assertSame('Falha sintética', $e->getMessage());
        }
        $this->assertFalse(app(RequestMetrics::class)->active);
    }

    public function test_instrumentacao_mede_sem_guardar_sql_ou_bindings_e_reinicia_contador(): void
    {
        config(['diagnostics.enabled' => true]);
        // O provider já iniciou antes de mudar a configuração neste teste.
        DB::listen(fn ($query) => app(RequestMetrics::class)->record($query->time));
        $this->get('/agenda')->assertHeaderMissing('Server-Timing');
        $response = $this->withHeader('X-Psystem-Diagnostics', '1')->get('/agenda');
        $response->assertOk()->assertHeader('X-Psystem-Peak-Memory');
        $this->assertStringContainsString('sql;dur=', $response->headers->get('Server-Timing'));
        $count = (int) $response->headers->get('X-Psystem-Sql-Count');
        $this->assertGreaterThan(0, $count);
        $next = $this->get('/agenda');
        $this->assertSame($count, (int) $next->headers->get('X-Psystem-Sql-Count'));
        $this->assertFalse(app(RequestMetrics::class)->active);
        $this->assertSame(['active', 'queries', 'sqlMilliseconds'], array_keys(get_object_vars(app(RequestMetrics::class))));
    }

    public function test_producao_nao_expoe_medicoes_mesmo_habilitada(): void
    {
        config(['diagnostics.enabled' => true]);
        $this->app->instance('env', 'production');
        $this->withHeader('X-Psystem-Diagnostics', '1')->get('/agenda')->assertHeaderMissing('Server-Timing');
    }
}
