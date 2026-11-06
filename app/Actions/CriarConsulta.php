<?php

namespace App\Actions;

use App\Models\Consulta;
use App\Models\Matricula;
use App\Services\HorarioConsulta;
use App\Services\OcupacaoAgenda;
use DateTimeInterface;

class CriarConsulta
{
    public static function dados(array $dados): array
    {
        // Os casos de uso com expediente informado fornecem a duração configurada.
        return ['duracao_minutos' => 50, 'status' => 'agendado', ...$dados];
    }

    public static function executar(array $dados, ?DateTimeInterface $criadoEm = null): Consulta
    {
        $dados = self::dados($dados);

        return HorarioConsulta::executar($dados['data_hora_consulta'], function ($valor) use ($dados, $criadoEm) {
            if ($dados['status'] !== 'cancelado') {
                OcupacaoAgenda::validar($valor, (int) $dados['paciente_id'], $dados['matricula_id'] ?? null);
            }

            $consulta = new Consulta($dados);
            if ($criadoEm !== null) {
                // O seeder histórico preserva a mesma auditoria do antigo lote SQL.
                $consulta->criado_em = $criadoEm;
            }
            $consulta->save();

            return $consulta;
        });
    }

    /** Repetição, cancelamento da ocorrência ou horário lotado só pulam a geração, sem erro. */
    public static function daMatricula(Matricula $matricula, mixed $dataHora, int $duracao): ?Consulta
    {
        // Sem escrita, o mesmo fast path de leitura evita transações para ocorrências
        // já existentes. Antes de criar, revalida sob o lock do instante.
        if ($matricula->consultas()->where('data_hora_consulta', $dataHora)->exists()) {
            return null;
        }

        return HorarioConsulta::executar($dataHora, function ($valor) use ($matricula, $dataHora, $duracao) {
            if ($matricula->consultas()->where('data_hora_consulta', $valor)->exists()
                || ! OcupacaoAgenda::cabeOcorrencia($matricula, $valor)) {
                return null;
            }

            return Consulta::create(self::dados([
                'matricula_id' => $matricula->id,
                'paciente_id' => $matricula->paciente_id,
                'data_hora_consulta' => $dataHora,
                'duracao_minutos' => $duracao,
                'modalidade' => $matricula->tipo_da_consulta,
            ]));
        });
    }
}
