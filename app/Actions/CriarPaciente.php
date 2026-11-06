<?php

namespace App\Actions;

use App\Models\Paciente;

class CriarPaciente
{
    public static function dados(array $dados): array
    {
        // Cadastro novo, sem matrícula, já era inativo no caso de uso HTTP.
        return ['status_paciente' => 'inativo', 'dia_vencimento' => 10, ...$dados];
    }

    public static function executar(array $dados): Paciente
    {
        return Paciente::create(self::dados($dados));
    }
}
