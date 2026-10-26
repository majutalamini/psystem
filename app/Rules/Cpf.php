<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Cpf implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! self::valido((string) $value)) {
            $fail('O CPF informado é inválido.');
        }
    }

    public static function valido(string $cpf): bool
    {
        $d = preg_replace('/\D/', '', $cpf);

        if (strlen($d) !== 11 || preg_match('/^(\d)\1{10}$/', $d)) {
            return false;
        }

        foreach ([9, 10] as $tamanho) {
            $soma = 0;
            for ($i = 0; $i < $tamanho; $i++) {
                $soma += (int) $d[$i] * ($tamanho + 1 - $i);
            }
            if (((($soma * 10) % 11) % 10) !== (int) $d[$tamanho]) {
                return false;
            }
        }

        return true;
    }
}
