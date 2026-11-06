<?php

namespace App\Services;

use App\Models\Configuracao;
use App\Models\Consulta;
use App\Models\Matricula;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * Quem pode ocupar um horário da agenda. Várias consultas podem acontecer no mesmo horário, até o limite
 * opcional de Configurações (nulo = sem limite). O mesmo paciente nunca tem duas consultas no mesmo horário.
 * Uma matrícula ativa reserva o horário mesmo fora da janela de consultas já geradas.
 * As chamadas que gravam rodam sob o bloqueio de HorarioConsulta para o instante.
 */
class OcupacaoAgenda
{
    /**
     * Valida uma consulta do paciente no instante ($valor = data/hora como o Eloquent grava).
     * Uma consulta ligada à matrícula é a própria ocorrência da reserva dela: essa reserva não conta contra.
     */
    public static function validar(string $valor, int $pacienteId, ?int $matriculaId = null, string $campo = 'hora'): void
    {
        $instante = Carbon::parse($valor);

        if (self::pacienteOcupado($instante, $valor, $pacienteId, $matriculaId)) {
            throw ValidationException::withMessages([$campo => 'Este paciente já tem consulta ou matrícula nesse horário.']);
        }

        $limite = Configuracao::atual()->consultas_simultaneas;
        if ($limite !== null && self::ocupacao($instante, $valor, $matriculaId) >= $limite) {
            throw ValidationException::withMessages([$campo => self::mensagemLimite($limite)]);
        }
    }

    /** A ocorrência da matrícula pode ser gerada? Se não puder, a geração só pula o horário. */
    public static function cabeOcorrencia(Matricula $matricula, string $valor): bool
    {
        $instante = Carbon::parse($valor);

        if (self::pacienteOcupado($instante, $valor, $matricula->paciente_id, $matricula->id)) {
            return false;
        }

        $limite = Configuracao::atual()->consultas_simultaneas;

        return $limite === null || self::ocupacao($instante, $valor, $matricula->id) < $limite;
    }

    public static function mensagemLimite(int $limite): string
    {
        return $limite === 1
            ? 'Esse horário já tem consulta marcada.'
            : "Esse horário já atingiu o limite de {$limite} consultas simultâneas.";
    }

    /** Consultas não canceladas no instante mais as reservas de matrícula ainda não geradas. */
    public static function ocupacao(Carbon $instante, string $valor, ?int $ignorarMatriculaId = null): int
    {
        $consultas = Consulta::where('data_hora_consulta', $valor)->where('status', '!=', 'cancelado')->count();

        return $consultas + self::reservas($instante, $valor)->where('id', '!=', $ignorarMatriculaId)->count();
    }

    /** Matrículas ativas de pacientes ativos que reservam o instante e ainda não têm ocorrência gravada nele (nem cancelada). */
    public static function reservas(Carbon $instante, string $valor): Collection
    {
        return Matricula::ativas()
            ->where('dia_da_matricula', Matricula::DIAS[$instante->dayOfWeekIso - 1])
            ->where('horario_da_matricula', $instante->format('H:i'))
            ->whereDate('inicio_da_matricula', '<=', $instante->toDateString())
            ->whereHas('paciente', fn ($q) => $q->where('status_paciente', 'ativo'))
            ->whereDoesntHave('consultas', fn ($q) => $q->where('data_hora_consulta', $valor))
            ->get(['id', 'paciente_id']);
    }

    private static function pacienteOcupado(Carbon $instante, string $valor, int $pacienteId, ?int $ignorarMatriculaId = null): bool
    {
        return Consulta::where('data_hora_consulta', $valor)->where('status', '!=', 'cancelado')
            ->where('paciente_id', $pacienteId)->exists()
            || self::reservas($instante, $valor)->where('paciente_id', $pacienteId)->where('id', '!=', $ignorarMatriculaId)->isNotEmpty();
    }

    /**
     * Horários lotados de cada dia do período, para a tela esconder (a gravação revalida no servidor).
     * Sem limite configurado nenhum horário fica lotado.
     *
     * @return array<string, list<string>> data ISO => horários
     */
    public static function lotadosNoPeriodo(Carbon $inicio, Carbon $fim, array $horas): array
    {
        $limite = Configuracao::atual()->consultas_simultaneas;
        if ($limite === null || $horas === []) {
            return [];
        }

        $inicio = $inicio->copy()->max(today());
        $contagem = [];
        Consulta::whereBetween('data_hora_consulta', [$inicio, $fim])->where('status', '!=', 'cancelado')
            ->pluck('data_hora_consulta')
            ->each(function ($dataHora) use (&$contagem) {
                $chave = $dataHora->format('Y-m-d H:i');
                $contagem[$chave] = ($contagem[$chave] ?? 0) + 1;
            });

        $matriculas = Matricula::ativas()->whereHas('paciente', fn ($q) => $q->where('status_paciente', 'ativo'))
            ->with(['consultas' => fn ($q) => $q->whereBetween('data_hora_consulta', [$inicio, $fim])->select('id', 'matricula_id', 'data_hora_consulta')])
            ->get();
        foreach ($matriculas as $matricula) {
            $geradas = $matricula->consultas->map(fn ($c) => $c->data_hora_consulta->format('Y-m-d H:i'))->flip();
            for ($dia = $inicio->copy()->startOfDay(); $dia->lte($fim); $dia->addDay()) {
                if ($dia->dayOfWeekIso !== $matricula->diaIso() || $dia->lt($matricula->inicio_da_matricula)) {
                    continue;
                }
                $chave = $dia->toDateString().' '.substr($matricula->horario_da_matricula, 0, 5);
                if (! isset($geradas[$chave])) {
                    $contagem[$chave] = ($contagem[$chave] ?? 0) + 1;
                }
            }
        }

        $lotados = [];
        foreach ($contagem as $chave => $total) {
            [$data, $hora] = explode(' ', $chave);
            if ($total >= $limite && in_array($hora, $horas, true)) {
                $lotados[$data][] = $hora;
            }
        }

        return $lotados;
    }
}
