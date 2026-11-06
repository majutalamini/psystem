<?php

namespace App\Actions;

use App\Models\Despesa;
use App\Models\DespesaPagamento;
use App\Models\RegistroAcao;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Pagamento total ou parcial de despesa, com a despesa bloqueada: não se paga mais que o saldo,
 * nem com dois envios ao mesmo tempo. A chave identifica o envio (reenviar não grava outro).
 */
class PagarDespesa
{
    /** @param array{valor: float|int|string, metodo_pagamento: string, data_pagamento: mixed, chave?: ?string} $dados */
    public static function executar(int $despesaId, array $dados): void
    {
        DB::transaction(function () use ($despesaId, $dados) {
            $despesa = Despesa::whereKey($despesaId)->lockForUpdate()->firstOrFail();
            $chave = $dados['chave'] ?? null;
            if ($chave !== null && DespesaPagamento::where('chave', $chave)->exists()) {
                return;
            }

            $saldo = $despesa->saldo();
            if ($dados['valor'] <= 0 || $dados['valor'] > $saldo) {
                throw ValidationException::withMessages([
                    'valor' => $saldo > 0
                        ? 'Informe um valor maior que zero e de no máximo R$ '.number_format($saldo, 2, ',', '.').' (o que falta pagar).'
                        : 'Esta despesa já foi paga.',
                ]);
            }

            DespesaPagamento::create([
                'despesa_id' => $despesa->id,
                'valor_pago' => $dados['valor'],
                'metodo_pagamento' => $dados['metodo_pagamento'],
                'data_pagamento' => $dados['data_pagamento'],
                'chave' => $chave,
            ]);
            RegistroAcao::registrar('despesa.pagar', $despesa);
        });
    }
}
