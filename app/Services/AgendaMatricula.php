<?php

namespace App\Services;

use App\Actions\CriarConsulta;
use App\Models\Configuracao;
use App\Models\Matricula;
use Illuminate\Support\Carbon;

/**
 * Mantém gravadas as consultas das matrículas numa janela móvel de MESES meses (hoje incluído).
 * Roda ao criar/alterar a matrícula e pelo comando agenda:gerar (agendado de hora em hora, para se
 * recuperar sozinho depois de dias sem scheduler). Abrir a agenda não grava nada.
 * Consultas já gravadas além da janela continuam como estão.
 */
class AgendaMatricula
{
    public const MESES = 2;

    public static function limite(): Carbon
    {
        return today()->addMonthsNoOverflow(self::MESES);
    }

    /** Último dia coberto pela janela. */
    public static function fimDaJanela(): Carbon
    {
        return self::limite();
    }

    public function gerar(Matricula $matricula): int
    {
        if (! $matricula->ativa() || ! $matricula->paciente->ativo()) {
            return 0;
        }

        $config = Configuracao::atual();
        if (! $config->atendeNo($matricula->dia_da_matricula)) {
            return 0;
        }

        $duracao = $config->duracao_sessao;
        $limite = self::fimDaJanela();
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

            // Nunca cria sessão retroativa, nem ao se recuperar de dias sem scheduler.
            if ($dataHora->isPast()) {
                continue;
            }

            if (CriarConsulta::daMatricula($matricula, $dataHora, $duracao)) {
                $criadas++;
            }
        }

        return $criadas;
    }

    /** Completa a janela de todas as matrículas ativas e registra a execução bem-sucedida. */
    public function gerarJanela(): int
    {
        $total = 0;
        foreach (Matricula::ativas()->with('paciente')->orderBy('id')->get() as $matricula) {
            $total += $this->gerar($matricula);
        }

        Configuracao::atual()->update(['agenda_gerada_em' => now()]);

        return $total;
    }

    /** Situação da janela para a tela: até quando há consultas gravadas e se a geração está atrasada. */
    public static function situacao(): array
    {
        $geradaEm = Configuracao::atual()->agenda_gerada_em;

        return [
            'dias' => (int) today()->diffInDays(self::fimDaJanela()) + 1,
            'ate' => self::fimDaJanela()->toDateString(),
            'geradaEm' => $geradaEm?->toIso8601String(),
            // Agendada de hora em hora: mais de um dia sem execução indica scheduler parado.
            'atrasada' => $geradaEm === null || $geradaEm->lt(now()->subDay()),
        ];
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
