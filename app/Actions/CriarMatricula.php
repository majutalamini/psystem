<?php

namespace App\Actions;

use App\Models\Matricula;

class CriarMatricula
{
    public static function dados(array $dados): array
    {
        return ['status_matricula' => 'ativa', ...$dados];
    }

    public static function executar(array $dados): Matricula
    {
        return Matricula::create(self::dados($dados));
    }
}
