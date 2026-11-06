<?php

namespace App\Actions;

use App\Models\Cobranca;
use App\Models\Consulta;
use App\Models\Paciente;
use App\Models\Prontuario;
use App\Models\RegistroAcao;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Inativar = encerrar todas as matrículas e apagar todas as consultas futuras (agendadas ou confirmadas).
 * O passado fica intacto. Uma consulta futura com prontuário ou cobrança vinculados não é apagada em
 * silêncio: a inativação é recusada e informa quais consultas resolver. Reativar (nova matrícula) não
 * restaura nada do que foi apagado ou encerrado.
 */
class InativarPaciente
{
    public static function executar(Paciente $paciente, string $campo = 'paciente'): void
    {
        DB::transaction(function () use ($paciente, $campo) {
            Paciente::whereKey($paciente->id)->lockForUpdate()->firstOrFail();

            $futuras = $paciente->consultas()
                ->where('data_hora_consulta', '>', now())
                ->whereIn('status', ['agendado', 'confirmado'])
                ->get(['id', 'data_hora_consulta']);
            $ids = $futuras->pluck('id');

            $comVinculo = Prontuario::whereIn('agenda_id', $ids)->pluck('agenda_id')
                ->merge(Cobranca::whereIn('agenda_id', $ids)->pluck('agenda_id'))
                ->unique();
            if ($comVinculo->isNotEmpty()) {
                $datas = $futuras->whereIn('id', $comVinculo)
                    ->map(fn (Consulta $c) => $c->data_hora_consulta->format('d/m/Y H:i'))
                    ->implode(', ');

                throw ValidationException::withMessages([
                    $campo => "Não foi possível inativar: a(s) consulta(s) futura(s) de {$datas} têm prontuário ou cobrança vinculados. Resolva essas consultas antes de inativar.",
                ]);
            }

            Consulta::whereIn('id', $ids)->delete();
            $paciente->matriculas()->ativas()->update(['status_matricula' => 'encerrada', 'fim_da_matricula' => today()]);
            $paciente->update(['status_paciente' => 'inativo']);
            RegistroAcao::registrar('paciente.inativar', $paciente);
        });
    }
}
