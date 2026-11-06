<?php

namespace Tests\Feature;

use App\Actions\CriarCobranca;
use App\Actions\RegistrarPagamento;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class ListasFixasTest extends ConsultorioTestCase
{
    public function test_listas_fixas_continuam_no_banco_sem_atrasado_nem_convenio(): void
    {
        $constraints = DB::select("SELECT conname, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conname IN ('cobrancas_situacao_check', 'pagamentos_metodo_pagamento_check', 'despesa_pagamentos_metodo_pagamento_check')");
        $this->assertCount(3, $constraints);
        foreach ($constraints as $constraint) {
            $this->assertStringContainsString('CHECK', $constraint->definition);
            $this->assertStringNotContainsString('atrasado', $constraint->definition);
            $this->assertStringNotContainsString('convenio', $constraint->definition);
        }
        $cobranca = CriarCobranca::executar(['paciente_id' => $this->paciente()->id, 'titulo' => 'Lista fixa', 'valor' => 200, 'vencimento' => '2026-09-28']);
        foreach (['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia'] as $metodo) {
            RegistrarPagamento::executar(['cobranca_id' => $cobranca->id, 'valor_pago' => 1, 'metodo_pagamento' => $metodo]);
        }
        $this->assertSame(6, $cobranca->pagamentos()->count());
        foreach ([
            fn () => DB::table('cobrancas')->where('id', $cobranca->id)->update(['situacao' => 'atrasado']),
            fn () => DB::table('pagamentos')->where('cobranca_id', $cobranca->id)->update(['metodo_pagamento' => 'convenio']),
            fn () => DB::table('despesa_pagamentos')->insert(['despesa_id' => DB::table('despesas')->insertGetId(['descricao' => 'Legado', 'categoria' => 'Outros', 'valor' => 10, 'vencimento' => '2026-09-28']),
                'valor_pago' => 10, 'metodo_pagamento' => 'convenio', 'data_pagamento' => now(), 'criado_em' => now()]),
        ] as $invalido) {
            try {
                DB::transaction($invalido);
                $this->fail('O CHECK deve recusar o valor legado.');
            } catch (QueryException $exception) {
                $this->assertSame('23514', $exception->errorInfo[0]);
            }
        }
    }
}
