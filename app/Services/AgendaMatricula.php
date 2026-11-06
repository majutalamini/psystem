<?php

namespace App\Services;

use App\Models\Configuracao;
use App\Models\Consulta;
use App\Models\Matricula;
use Illuminate\Support\Carbon;

/**
 * Mantém a agenda preenchida com as consultas das matrículas pelos próximos MESES meses.
 * Roda ao salvar a matrícula e todo dia pelo comando agenda:gerar. Nada é gerado nem exibido além desse limite:
 * a matrícula é permanente, mas a agenda só enxerga a janela dos próximos meses.
 */
class AgendaMatricula
{
    public const MESES = 2;

    /** Último dia visível/gerado da agenda (hoje + MESES meses). */
    public static function limite(): Carbon
    {
        return today()->addMonthsNoOverflow(self::MESES);
    }

    public function gerar(Matricula $matricula): int
    {
        if (! $matricula->paciente->ativo()) {
            return 0;
        }

        $config = Configuracao::atual();
        if (! $config->atendeNo($matricula->dia_da_matricula)) {
            return 0;
        }

        $duracao = $config->duracao_sessao;
        $limite = self::limite();
        $dia = today()->max($matricula->inicio_da_matricula)->copy();

        // Avança até o primeiro dia da semana da matrícula.
        while ($dia->dayOfWeekIso !== $matricula->diaIso()) {
            $dia->addDay();
        }

        $criadas = 0;
        for (; $dia->lte($limite); $dia->addWeek()) {
            if (! $config->atendeNo($dia)) {
                continue;
            }

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

    /**
     * Garante as consultas das matrículas ativas na semana que começa em $inicioSemana, desde que ela esteja dentro
     * da janela de MESES meses da agenda (cobre, por exemplo, uma matrícula criada depois da geração diária).
     */
    public function gerarSemana(Carbon $inicioSemana): int
    {
        $limite = self::limite();
        if ($inicioSemana->gt($limite)) {
            return 0;
        }

        $config = Configuracao::atual();
        $duracao = $config->duracao_sessao;
        $criadas = 0;

        $matriculas = Matricula::ativas()->with('paciente')->get()->filter(fn ($m) => $m->paciente->ativo());
        foreach ($matriculas as $matricula) {
            $dia = $inicioSemana->copy()->addDays($matricula->diaIso() - 1);
            $dataHora = Carbon::parse($dia->toDateString().' '.$matricula->horario_da_matricula);

            if ($dataHora->isPast() || $dia->gt($limite) || $dia->lt($matricula->inicio_da_matricula) || ! $config->atendeNo($dia)) {
                continue;
            }

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
