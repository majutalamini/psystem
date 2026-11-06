<?php

namespace App\Actions;

use App\Models\Cobranca;

class CriarCobranca
{
    public static function dados(array $dados): array
    {
        return ['situacao' => 'pendente', ...$dados];
    }

    public static function executar(array $dados): Cobranca
    {
        return Cobranca::create(self::dados($dados));
    }
}
