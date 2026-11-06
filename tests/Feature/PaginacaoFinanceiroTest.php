<?php

namespace Tests\Feature;

use App\Actions\CriarCobranca;
use App\Http\Controllers\FinanceiroController;
use App\Models\Cobranca;
use App\Models\Despesa;

class PaginacaoFinanceiroTest extends ConsultorioTestCase
{
    public function test_paginacao_entrega_todos_os_lancamentos_uma_vez_com_totais_do_conjunto_inteiro(): void
    {
        $paciente = $this->paciente();
        $bills = collect();
        for ($i = 0; $i < 56; $i++) {
            $bills->push(CriarCobranca::executar(['paciente_id' => $paciente->id, 'titulo' => 'Conta '.$i, 'valor' => 200,
                'vencimento' => $i === 0 ? '2026-09-27' : '2026-09-29']));
        }
        Cobranca::create(['paciente_id' => $paciente->id, 'titulo' => 'Cancelada', 'valor' => 999, 'vencimento' => '2026-09-29', 'situacao' => 'cancelado']);
        foreach ([80, 20] as $value) {
            $bills[0]->pagamentos()->create(['valor_pago' => $value, 'metodo_pagamento' => 'pix', 'data_pagamento' => today()]);
        }
        $bills[1]->pagamentos()->create(['valor_pago' => 200, 'metodo_pagamento' => 'pix', 'data_pagamento' => today()]);
        $bills[1]->update(['situacao' => 'pago']);
        // Recebimento estornado não entra em nenhuma soma.
        $bills[2]->pagamentos()->create(['valor_pago' => 200, 'metodo_pagamento' => 'pix', 'data_pagamento' => today()])
            ->forceFill(['estornado_em' => now(), 'estornado_por' => $this->psicologa->id, 'motivo_estorno' => 'Teste'])->save();
        foreach ([['valor' => 300], ['valor' => 100], ['valor' => 50, 'vencimento' => '2026-09-27']] as $data) {
            Despesa::create(['descricao' => 'Despesa', 'categoria' => 'Outros', 'vencimento' => '2026-09-29', ...$data]);
        }
        // Despesa de 300 paga em parte (100); um pagamento estornado de 200 não conta.
        $parcial = Despesa::where('valor', 300)->sole();
        $parcial->pagamentos()->create(['valor_pago' => 100, 'metodo_pagamento' => 'pix', 'data_pagamento' => today()]);
        $parcial->pagamentos()->create(['valor_pago' => 200, 'metodo_pagamento' => 'pix', 'data_pagamento' => today()])
            ->forceFill(['estornado_em' => now(), 'estornado_por' => $this->psicologa->id, 'motivo_estorno' => 'Teste'])->save();
        $rows = [];
        foreach ([1, 2, 3] as $page) {
            $props = $this->get('/financeiro?receber_page='.$page)->assertOk()->viewData('page')['props'];
            $this->assertCount($page === 3 ? 6 : 25, $props['receivables']);
            $this->assertSame(56, $props['receivablePagination']['total']);
            $this->assertSame(['receivableCount' => 56, 'totalReceber' => 11200.0, 'recebido' => 300.0,
                'pendenteReceber' => 10800.0, 'atrasadoReceber' => 100.0, 'payableCount' => 3,
                'totalPagar' => 450.0, 'pago' => 100.0, 'pendentePagar' => 300.0], $props['financeSummary']);
            array_push($rows, ...collect($props['receivables'])->all());
        }
        $this->assertCount(56, array_unique(array_column($rows, 'id')));
        $expected = FinanceiroController::cobrancas()->keyBy('id')->sortKeys()->all();
        $actual = collect($rows)->keyBy('id')->sortKeys()->all();
        $this->assertSame($expected, $actual);
        $last = $this->get('/financeiro?receber_page=999')->viewData('page')['props'];
        $this->assertSame(3, $last['receivablePagination']['page']);
        $this->assertCount(6, $last['receivables']);
    }
}
