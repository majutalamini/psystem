<?php

namespace App\Services;

use App\Models\Consulta;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Facades\DB;
use LogicException;

/** Exclusão mútua técnica por instante; a decisão de disponibilidade fica no PHP. */
class HorarioConsulta
{
    public static function executar(mixed $dataHora, callable $operacao): mixed
    {
        return DB::transaction(fn () => $operacao(self::bloquear($dataHora)));
    }

    public static function bloquear(mixed $dataHora, ?ConnectionInterface $connection = null): mixed
    {
        $connection ??= DB::connection();
        if ($connection->transactionLevel() < 1) {
            throw new LogicException('O bloqueio de horário exige transação.');
        }
        // Use a precisão/formato realmente serializados pelo Eloquent. Instantes
        // com microssegundos distintos podem ser persistidos no mesmo segundo.
        $valor = (new Consulta(['data_hora_consulta' => $dataHora]))->getAttributes()['data_hora_consulta'];
        // O cast usa o mesmo fuso da conexão que interpreta o INSERT; epoch é
        // independente da representação local. Só funções nativas, sem DDL.
        $connection->selectOne("SELECT pg_advisory_xact_lock(hashtextextended('psystem:agenda:' || EXTRACT(EPOCH FROM CAST(? AS timestamptz))::text, 0))", [$valor]);

        return $valor;
    }

    /** Exclusão mútua para matrículas no mesmo dia da semana e horário (reservas semanais). */
    public static function bloquearReserva(string $dia, string $hora): void
    {
        if (DB::transactionLevel() < 1) {
            throw new LogicException('O bloqueio de horário exige transação.');
        }
        DB::selectOne("SELECT pg_advisory_xact_lock(hashtextextended('psystem:matricula:' || ? || ' ' || ?, 0))", [$dia, substr($hora, 0, 5)]);
    }
}
