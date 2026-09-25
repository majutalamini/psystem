<?php

namespace App\Support;

use Carbon\Carbon;
use Carbon\CarbonInterface;

/**
 * Conversões entre o formato do banco e o formato que o front já usa
 * (datas dd/mm/aaaa, rótulos com maiúscula, cor do avatar).
 */
class Tela
{
    public const CORES = ['purple', 'yellow', 'pink', 'green', 'teal'];

    public const METODOS = [
        'pix' => 'Pix',
        'cartao_credito' => 'Cartão de crédito',
        'cartao_debito' => 'Cartão de débito',
        'dinheiro' => 'Dinheiro',
        'transferencia' => 'Transferência',
        'boleto' => 'Boleto',
        'convenio' => 'Convênio',
    ];

    public const MODALIDADES = [
        'presencial' => 'Consulta presencial',
        'online' => 'Consulta online',
    ];

    public const SEXOS = [
        'feminino' => 'Feminino',
        'masculino' => 'Masculino',
        'outro' => 'Outro',
        'prefiro_nao_informar' => 'Prefiro não informar',
    ];

    public static function data(?CarbonInterface $data): ?string
    {
        return $data?->format('d/m/Y');
    }

    /** Lê "dd/mm/aaaa" vindo dos formulários. */
    public static function lerData(?string $texto): ?Carbon
    {
        return $texto ? Carbon::createFromFormat('d/m/Y', $texto)->startOfDay() : null;
    }

    public static function cor(int $id): string
    {
        return self::CORES[$id % count(self::CORES)];
    }

    public static function iniciais(string $nome): string
    {
        $partes = array_slice(preg_split('/\s+/', trim($nome)), 0, 2);

        return mb_strtoupper(implode('', array_map(fn ($p) => mb_substr($p, 0, 1), $partes)));
    }

    public static function cpf(string $cpf): string
    {
        return preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $cpf);
    }

    public static function metodo(string $rotulo): string
    {
        return array_search($rotulo, self::METODOS, true) ?: 'pix';
    }
}
