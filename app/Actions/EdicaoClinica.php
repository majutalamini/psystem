<?php

namespace App\Actions;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Controle otimista das edições clínicas: quem salva informa a versão que abriu. Se outra pessoa salvou
 * antes, a edição é recusada em vez de sobrescrever; o formulário de quem tentou continua preenchido.
 */
class EdicaoClinica
{
    public static function executar(Model $registro, int $versaoAberta, string $rotulo, callable $alterar): void
    {
        DB::transaction(function () use ($registro, $versaoAberta, $rotulo, $alterar) {
            $atual = $registro->newQuery()->whereKey($registro->getKey())->lockForUpdate()->firstOrFail();
            if ((int) $atual->versao !== $versaoAberta) {
                throw ValidationException::withMessages([
                    'versao' => "Este {$rotulo} foi alterado por outra pessoa depois que você o abriu. Seu texto continua no formulário: copie o que escreveu, recarregue a página e aplique de novo.",
                ]);
            }

            $alterar($atual);
            $atual->forceFill(['versao' => $atual->versao + 1])->save();
        });
    }
}
