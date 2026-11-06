<?php

namespace App\Services;

use App\Models\Despesa;
use App\Models\DespesaRecorrente;
use Illuminate\Support\Carbon;

/**
 * Contas a pagar recorrentes: uma conta por mês, vencendo no dia escolhido (31 vira o último dia dos meses curtos).
 * A primeira é criada junto com a recorrência; as seguintes são lançadas pelo comando despesas:gerar,
 * no começo de cada mês, para a conta aparecer no mês em que vence.
 */
class DespesasRecorrentes
{
    public static function vencimento(Carbon $mes, int $dia): Carbon
    {
        $inicio = $mes->copy()->startOfMonth();

        return $inicio->copy()->day(min($dia, $inicio->daysInMonth));
    }

    /** Lança a conta do mês de $mes. Uma por recorrência e mês, mesmo que a anterior tenha sido cancelada. */
    public function lancar(DespesaRecorrente $recorrencia, Carbon $mes): ?Despesa
    {
        $mes = $mes->copy()->startOfMonth();

        $existe = Despesa::withoutGlobalScopes()
            ->where('recorrente_id', $recorrencia->id)
            ->whereDate('competencia', $mes)
            ->exists();
        if ($existe) {
            return null;
        }

        return Despesa::create([
            'descricao' => $recorrencia->descricao,
            'categoria' => $recorrencia->categoria,
            'valor' => $recorrencia->valor,
            'vencimento' => self::vencimento($mes, (int) $recorrencia->dia)->toDateString(),
            'recorrente_id' => $recorrencia->id,
            'competencia' => $mes->toDateString(),
        ]);
    }

    /** Contas do mês corrente das recorrências ativas que já começaram em meses anteriores. */
    public function gerarDoMes(): int
    {
        $mes = today()->startOfMonth();
        $criadas = 0;

        foreach (DespesaRecorrente::where('ativa', true)->get() as $recorrencia) {
            if ($recorrencia->inicio->lt($mes) && $this->lancar($recorrencia, $mes)) {
                $criadas++;
            }
        }

        return $criadas;
    }
}
