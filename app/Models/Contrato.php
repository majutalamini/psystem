<?php

namespace App\Models;

use App\Support\Tela;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Pacote de sessões do paciente (ex.: 8 sessões). Cada ciclo do pacote gera uma cobrança; ao terminar as sessões do
 * ciclo o contrato renova sozinho até a psicóloga encerrá-lo. Inadimplente = bloqueado (agenda e renovação param).
 */
class Contrato extends Model
{
    protected $table = 'contratos';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = 'atualizado_em';

    public const STATUS = ['ativo' => 'Ativo', 'bloqueado' => 'Bloqueado', 'encerrado' => 'Encerrado'];

    protected $fillable = [
        'paciente_id', 'sessoes_pacote', 'valor_pacote', 'data_inicio', 'status', 'encerrado_em',
        'ciclo_atual', 'ciclo_inicio', 'ciclo_fim',
    ];

    protected function casts(): array
    {
        return [
            'data_inicio' => 'date',
            'encerrado_em' => 'date',
            'ciclo_inicio' => 'date',
            'ciclo_fim' => 'date',
            'valor_pacote' => 'decimal:2',
            'sessoes_pacote' => 'integer',
            'ciclo_atual' => 'integer',
        ];
    }

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class);
    }

    public function cobrancas(): HasMany
    {
        return $this->hasMany(Cobranca::class);
    }

    /** Ativo ou bloqueado: o contrato ainda vale (o paciente só pode ter um assim). */
    public function scopeAbertos(Builder $query): void
    {
        $query->whereIn('status', ['ativo', 'bloqueado']);
    }

    public function aberto(): bool
    {
        return in_array($this->status, ['ativo', 'bloqueado'], true);
    }

    /** Sessões do ciclo atual que já aconteceram (realizadas ou faltas) ou passaram na agenda. */
    public function sessoesFeitasNoCiclo(): int
    {
        if (! $this->ciclo_inicio) {
            return 0;
        }

        return Consulta::whereIn('matricula_id', $this->matriculas()->pluck('id'))
            ->where('status', '!=', 'cancelado')
            ->where('data_hora_consulta', '>=', $this->ciclo_inicio->copy()->startOfDay())
            ->where('data_hora_consulta', '<=', min(now(), ($this->ciclo_fim ?? now())->copy()->endOfDay()))
            ->count();
    }

    public function paraTela(bool $comProgresso = false): array
    {
        $matriculas = $this->relationLoaded('matriculas') ? $this->matriculas : $this->matriculas()->get();

        return [
            'id' => $this->id,
            'status' => $this->status,
            'statusLabel' => self::STATUS[$this->status] ?? $this->status,
            'sessoes' => $this->sessoes_pacote,
            'valor' => (float) $this->valor_pacote,
            'inicio' => Tela::data($this->data_inicio),
            'encerradoEm' => Tela::data($this->encerrado_em),
            'ciclo' => $this->ciclo_atual,
            'cicloInicio' => Tela::data($this->ciclo_inicio),
            'cicloFim' => Tela::data($this->ciclo_fim),
            'feitasNoCiclo' => $comProgresso ? $this->sessoesFeitasNoCiclo() : null,
            'matriculas' => $matriculas->sortBy('id')->map->paraTela()->values(),
        ];
    }
}
