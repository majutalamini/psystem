<?php

namespace App\Models;

use App\Support\Tela;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Matricula extends Model
{
    protected $table = 'matriculas';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = null;

    /** Índice 0 = segunda, como no front. */
    public const DIAS = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo'];

    protected $fillable = [
        'paciente_id', 'inicio_da_matricula', 'horario_da_matricula',
        'dia_da_matricula', 'tipo_da_consulta', 'valor_sessao', 'status_matricula', 'fim_da_matricula',
    ];

    protected function casts(): array
    {
        return ['inicio_da_matricula' => 'date', 'fim_da_matricula' => 'date', 'valor_sessao' => 'decimal:2'];
    }

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    public function consultas(): HasMany
    {
        return $this->hasMany(Consulta::class);
    }

    public function scopeAtivas(Builder $query): void
    {
        $query->where('status_matricula', 'ativa');
    }

    public function ativa(): bool
    {
        return $this->status_matricula === 'ativa';
    }

    /** Dia da semana no padrão ISO do Carbon (1 = segunda ... 7 = domingo). */
    public function diaIso(): int
    {
        return array_search($this->dia_da_matricula, self::DIAS, true) + 1;
    }

    public function paraTela(): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status_matricula,
            'weekday' => $this->diaIso() - 1,
            'time' => substr($this->horario_da_matricula, 0, 5),
            'tipo' => Tela::MODALIDADES[$this->tipo_da_consulta],
            'valor' => (float) $this->valor_sessao,
            'inicio' => Tela::data($this->inicio_da_matricula),
            'fim' => Tela::data($this->fim_da_matricula),
        ];
    }
}
