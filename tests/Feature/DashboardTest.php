<?php

namespace Tests\Feature;

use App\Actions\CriarCobranca;
use App\Models\Consulta;

/** Somas do Dashboard feitas no banco e cartão de atenção limitado (etapa 3, carga). */
class DashboardTest extends ConsultorioTestCase
{
    public function test_faturamento_e_sessoes_por_mes_somam_no_banco_e_ignoram_estorno(): void
    {
        $paciente = $this->paciente();
        $cobranca = CriarCobranca::executar(['paciente_id' => $paciente->id, 'titulo' => 'X', 'valor' => 5000, 'vencimento' => '2026-09-01']);
        $cobranca->pagamentos()->create(['valor_pago' => 1500, 'metodo_pagamento' => 'pix', 'data_pagamento' => '2026-09-10 10:00']);
        $cobranca->pagamentos()->create(['valor_pago' => 500, 'metodo_pagamento' => 'pix', 'data_pagamento' => '2026-08-31 23:30']); // agosto em São Paulo
        $cobranca->pagamentos()->create(['valor_pago' => 900, 'metodo_pagamento' => 'pix', 'data_pagamento' => '2026-09-11 10:00'])
            ->forceFill(['estornado_em' => now(), 'estornado_por' => $this->psicologa->id, 'motivo_estorno' => 'Teste'])->save();
        foreach (['2026-09-02 08:00', '2026-09-03 08:00', '2026-07-15 08:00'] as $quando) {
            Consulta::create(['paciente_id' => $paciente->id, 'data_hora_consulta' => $quando, 'duracao_minutos' => 50, 'modalidade' => 'online', 'status' => 'realizado']);
        }

        $props = $this->get('/')->assertOk()->viewData('page')['props'];

        $this->assertEquals(1500.0, $props['stats']['faturamentoMes']);
        $receita = collect($props['revenueData'])->pluck('value', 'month');
        $this->assertEquals(1.5, $receita['Set']);
        $this->assertEquals(0.5, $receita['Ago']);
        $sessoes = collect($props['sessionsPerMonth'])->pluck('sessoes', 'month');
        $this->assertSame(2, $sessoes['Set']);
        $this->assertSame(1, $sessoes['Jul']);
    }

    public function test_cartao_de_atencao_traz_os_mais_recentes_e_o_total(): void
    {
        for ($i = 1; $i <= 12; $i++) {
            $paciente = $this->paciente(['nome' => sprintf('Inativo %02d', $i), 'status_paciente' => 'inativo']);
            Consulta::create(['paciente_id' => $paciente->id, 'data_hora_consulta' => sprintf('2026-08-%02d 08:00', $i), 'duracao_minutos' => 50, 'modalidade' => 'online', 'status' => 'realizado']);
        }

        $props = $this->get('/')->assertOk()->viewData('page')['props'];

        $this->assertSame(12, $props['attentionTotal']);
        $this->assertCount(8, $props['attentionPatients']);
        $this->assertSame('Inativo 12', $props['attentionPatients'][0]['name']); // sessão mais recente primeiro
    }
}
