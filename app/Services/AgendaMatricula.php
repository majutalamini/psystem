<?php

namespace App\Services;

use App\Models\Configuracao;
use App\Models\Consulta;
use App\Models\Matricula;
use Illuminate\Support\Carbon;

/**
 * Mantém a agenda preenchida com as consultas das matrículas pelas próximas SEMANAS semanas.
 * Roda ao salvar a matrícula e todo dia pelo comando agenda:gerar.
 */
class AgendaMatricula
{
    public const SEMANAS = 4;

    public function gerar(Matricula $matricula): int
    {
        if (! $matricula->paciente->ativo()) {
            return 0;
        }

        $duracao = Configuracao::atual()->duracao_sessao;
        $limite = today()->addWeeks(self::SEMANAS);
        $dia = today()->max($matricula->inicio_da_matricula)->copy();

        // Avança até o primeiro dia da semana da matrícula.
        while ($dia->dayOfWeekIso !== $matricula->diaIso()) {
            $dia->addDay();
        }

        $criadas = 0;
        for (; $dia->lte($limite); $dia->addWeek()) {
            $dataHora = Carbon::parse($dia->toDateString().' '.$matricula->horario_da_matricula);

            if ($dataHora->isPast()) {
                continue;
            }

            // Já gerada antes (mesmo que cancelada depois) ou horário ocupado por outra consulta.
            $jaGerada = $matricula->consultas()->where('data_hora_consulta', $dataHora)->exists();
            if ($jaGerada || Consulta::horarioOcupado($dataHora)) {
                continue;
            }

            $matricula->consultas()->create([
                'paciente_id' => $matricula->paciente_id,
                'data_hora_consulta' => $dataHora,
                'duracao_minutos' => $duracao,
                'modalidade' => $matricula->tipo_da_consulta,
            ]);
            $criadas++;
        }

        return $criadas;
    }

    /** Apaga as consultas futuras da matrícula que ainda não foram confirmadas nem atendidas. */
    public function limparFuturas(Matricula $matricula): void
    {
        $matricula->consultas()
            ->where('status', 'agendado')
            ->where('data_hora_consulta', '>', now())
            ->delete();
    }
}
