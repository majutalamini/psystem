<?php

namespace App\Actions;

use App\Models\Cobranca;
use App\Models\Pagamento;
use App\Models\RegistroAcao;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Recebimento total ou parcial. Parcial: a cobrança continua em aberto com o restante,
 * que pode ser recebido depois em outro pagamento. Só vira "pago" quando o saldo zera.
 * O saldo é conferido com a cobrança bloqueada: dois recebimentos simultâneos não passam do valor.
 * A chave identifica o envio: reenviar o mesmo recebimento não grava outro.
 */
class ReceberCobranca
{
    /** @param array{valor: float|int|string, metodo_pagamento: string, data_pagamento: mixed, chave?: ?string} $dados */
    public static function executar(int $cobrancaId, array $dados): void
    {
        DB::transaction(function () use ($cobrancaId, $dados) {
            $cobranca = Cobranca::whereKey($cobrancaId)->lockForUpdate()->firstOrFail();
            $chave = $dados['chave'] ?? null;
            if ($chave !== null && Pagamento::where('chave', $chave)->exists()) {
                return; // mesmo envio repetido: já registrado
            }
            if ($cobranca->situacao === 'cancelado') {
                throw ValidationException::withMessages(['valor' => 'Esta cobrança foi cancelada e não pode ser recebida.']);
            }

            $saldo = $cobranca->saldo();
            if ($dados['valor'] <= 0 || $dados['valor'] > $saldo) {
                throw ValidationException::withMessages([
                    'valor' => $saldo > 0
                        ? 'Informe um valor maior que zero e de no máximo R$ '.number_format($saldo, 2, ',', '.').' (o que falta receber).'
                        : 'Esta cobrança já foi recebida por completo.',
                ]);
            }

            RegistrarPagamento::executar([
                'cobranca_id' => $cobranca->id,
                'valor_pago' => $dados['valor'],
                'metodo_pagamento' => $dados['metodo_pagamento'],
                'data_pagamento' => $dados['data_pagamento'],
                'chave' => $chave,
            ]);
            $cobranca->update(['situacao' => $cobranca->saldo() <= 0 ? 'pago' : 'pendente']);
            RegistroAcao::registrar('cobranca.receber', $cobranca);
        });
    }
}
