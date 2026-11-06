<?php

namespace App\Actions;

use App\Models\Pagamento;

class RegistrarPagamento
{
    public static function dados(array $dados): array
    {
        // Data financeira explícita prevalece. O fallback antes vinha do SQL.
        return ['data_pagamento' => now(), ...$dados];
    }

    public static function executar(array $dados): Pagamento
    {
        return Pagamento::create(self::dados($dados));
    }
}
