<?php

namespace Tests\Feature;

use App\Http\Controllers\RelatorioController;
use Illuminate\Support\Facades\DB;

class CentralRelatoriosTest extends ConsultorioTestCase
{
    public function test_central_nao_le_os_conjuntos_dos_relatorios(): void
    {
        $queries = [];
        DB::listen(function ($query) use (&$queries): void {
            $queries[] = $query->sql;
        });
        $props = $this->get('/relatorios')->assertOk()->viewData('page')['props'];
        $this->assertNull($props['activeReport']);
        $this->assertSame([], $props['reportData']);
        foreach ($queries as $query) {
            foreach (['pacientes', 'agenda', 'cobrancas', 'despesas', 'anamneses', 'prontuarios', 'configuracoes'] as $table) {
                $this->assertStringNotContainsString('"'.$table.'"', $query);
            }
        }
    }

    public function test_cada_relatorio_recebe_somente_os_conjuntos_que_utiliza(): void
    {
        $this->paciente();
        foreach (RelatorioController::CONTRATOS as $report => $keys) {
            $props = $this->get('/relatorios?relatorio='.$report)->assertOk()->viewData('page')['props'];
            $this->assertSame($report, $props['activeReport']);
            $actual = array_keys($props['reportData']);
            sort($actual);
            sort($keys);
            $this->assertSame($keys, $actual, $report);
            $this->assertArrayNotHasKey('patients', $props);
        }
        $this->getJson('/relatorios?relatorio=desconhecido')->assertUnprocessable();
    }
}
