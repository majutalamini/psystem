<?php

namespace App\Actions;

use App\Models\Cobranca;
use App\Models\Despesa;
use App\Models\RegistroAcao;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Estorno específico: qualquer pagamento da cobrança ou da despesa, com motivo. O pagamento continua
 * gravado (data, autor e motivo do estorno) e sai da soma. Cobrança paga com saldo reaberto volta a pendente.
 */
class EstornarPagamento
{
    public static function executar(Cobranca|Despesa $conta, int $pagamentoId, string $motivo, int $psicologoId): void
    {
        DB::transaction(function () use ($conta, $pagamentoId, $motivo, $psicologoId) {
            /** @var Cobranca|Despesa $conta */
            $conta = $conta->newQuery()->whereKey($conta->getKey())->lockForUpdate()->firstOrFail();
            /** @var Model|null $pagamento */
            $pagamento = $conta->pagamentos()->whereKey($pagamentoId)->first();
            if ($pagamento === null) {
                throw ValidationException::withMessages(['pagamento' => 'Pagamento não encontrado nesta conta.']);
            }
            if ($pagamento->estornado()) {
                throw ValidationException::withMessages(['pagamento' => 'Este pagamento já foi estornado.']);
            }

            $pagamento->forceFill([
                'estornado_em' => now(),
                'estornado_por' => $psicologoId,
                'motivo_estorno' => $motivo,
            ])->save();

            $conta->unsetRelation('pagamentos');
            if ($conta instanceof Cobranca) {
                if ($conta->situacao === 'pago' && $conta->saldo() > 0) {
                    $conta->update(['situacao' => 'pendente']);
                }
                RegistroAcao::registrar('cobranca.estornar', $conta);
            } else {
                RegistroAcao::registrar('despesa.estornar', $conta);
            }
        });
    }
}
