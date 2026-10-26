<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/** Tabela de uma linha só com as preferências do consultório. */
class Configuracao extends Model
{
    protected $table = 'configuracoes';

    public $timestamps = false;

    /** Abreviações na mesma ordem de Matricula::DIAS (0 = segunda ... 6 = domingo). */
    public const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    protected $attributes = [
        'expediente_inicio' => '08:00',
        'expediente_fim' => '18:00',
        'duracao_sessao' => 50,
        'intervalo_sessao' => 0,
    ];

    protected $fillable = [
        'meta_faturamento_mensal', 'meta_horas_semanais', 'meta_sessoes_semanais', 'meta_novos_pacientes_mes',
        'whatsapp_ativo', 'whatsapp_numero', 'whatsapp_dias_antes',
        'mensagem_lembrete', 'mensagem_retorno', 'mensagem_cobranca',
        'dias_atendimento', 'expediente_inicio', 'expediente_fim', 'duracao_sessao',
        'intervalo_sessao', 'almoco_inicio', 'almoco_fim',
    ];

    protected function casts(): array
    {
        return [
            'meta_faturamento_mensal' => 'decimal:2',
            'whatsapp_ativo' => 'boolean',
            'dias_atendimento' => 'array',
        ];
    }

    public static function atual(): self
    {
        return static::firstOrCreate([], ['dias_atendimento' => ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']]);
    }

    /** Horários do expediente gerados conforme a duração da sessão, o intervalo e a pausa de almoço. */
    public function horarios(): array
    {
        $duracao = (int) $this->duracao_sessao;
        $intervalo = max(0, (int) $this->intervalo_sessao);
        $inicio = self::emMinutos($this->expediente_inicio);
        $fim = self::emMinutos($this->expediente_fim);

        if ($duracao <= 0 || $inicio === null || $fim === null || $inicio >= $fim) {
            return [];
        }

        $almocoIni = self::emMinutos($this->almoco_inicio);
        $almocoFim = self::emMinutos($this->almoco_fim);

        $periodos = ($almocoIni !== null && $almocoFim !== null && $almocoIni > $inicio && $almocoFim > $almocoIni && $almocoFim < $fim)
            ? [[$inicio, $almocoIni], [$almocoFim, $fim]]
            : [[$inicio, $fim]];

        $passo = $duracao + $intervalo;
        $horarios = [];
        foreach ($periodos as [$iniPeriodo, $fimPeriodo]) {
            for ($min = $iniPeriodo; $min + $duracao <= $fimPeriodo; $min += $passo) {
                $horarios[] = sprintf('%02d:%02d', intdiv($min, 60), $min % 60);
            }
        }

        return $horarios;
    }

    private static function emMinutos(?string $hora): ?int
    {
        if (! $hora) {
            return null;
        }
        [$h, $m] = array_map('intval', explode(':', $hora));

        return $h * 60 + $m;
    }

    /** Confere se o consultório atende na data, no índice do dia (0 = Seg ... 6 = Dom) ou no nome do dia. */
    public function atendeNo(mixed $data): bool
    {
        $dias = $this->dias_atendimento ?? [];

        if (is_int($data)) {
            $sigla = self::DIAS[$data] ?? null;
        } elseif (is_string($data) && in_array($data, self::DIAS, true)) {
            $sigla = $data;
        } elseif (is_string($data) && ($indice = array_search($data, Matricula::DIAS, true)) !== false) {
            $sigla = self::DIAS[$indice];
        } else {
            $diaIso = ($data instanceof \DateTimeInterface ? Carbon::instance($data) : Carbon::parse($data))->dayOfWeekIso;
            $sigla = self::DIAS[$diaIso - 1] ?? null;
        }

        return $sigla !== null && in_array($sigla, $dias, true);
    }

    public function metas(): array
    {
        return [
            'faturamentoMensal' => (float) $this->meta_faturamento_mensal,
            'horasSemanais' => $this->meta_horas_semanais,
            'sessoesSemanais' => $this->meta_sessoes_semanais,
            'novosPacientesMes' => $this->meta_novos_pacientes_mes,
        ];
    }

    public function whatsapp(): array
    {
        return [
            'enabled' => $this->whatsapp_ativo,
            'numero' => $this->whatsapp_numero,
            'diasAntes' => $this->whatsapp_dias_antes,
            'lembrete' => $this->mensagem_lembrete,
            'retorno' => $this->mensagem_retorno,
            'cobranca' => $this->mensagem_cobranca,
        ];
    }

    public function horario(): array
    {
        return [
            'dias' => $this->dias_atendimento,
            'inicio' => substr($this->expediente_inicio, 0, 5),
            'fim' => substr($this->expediente_fim, 0, 5),
            'duracao' => $this->duracao_sessao,
            'intervalo' => (int) $this->intervalo_sessao,
            'almocoInicio' => $this->almoco_inicio ? substr($this->almoco_inicio, 0, 5) : '',
            'almocoFim' => $this->almoco_fim ? substr($this->almoco_fim, 0, 5) : '',
        ];
    }
}
