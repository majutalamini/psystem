<?php

namespace App\Models;

use App\Support\Tela;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Validation\ValidationException;

class Matricula extends Model
{
    protected $table = 'matriculas';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = null;

    /** Índice 0 = segunda, como no front. */
    public const DIAS = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo'];

    protected $fillable = [
        'paciente_id', 'contrato_id', 'inicio_da_matricula', 'horario_da_matricula',
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

    public function contrato(): BelongsTo
    {
        return $this->belongsTo(Contrato::class);
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

    /**
     * Confere se o dia e horário cabem no expediente e não são de outra matrícula ativa.
     * $campo é o prefixo dos erros (ex.: "horarios.0." no formulário do contrato).
     */
    public static function conferirHorario(int $weekday, string $time, int $pacienteId, ?int $ignorarId = null, string $campo = ''): void
    {
        $config = Configuracao::atual();
        if (! $config->atendeNo($weekday)) {
            throw ValidationException::withMessages([$campo.'weekday' => 'Não há atendimento nesse dia da semana.']);
        }
        if (! in_array($time, $config->horarios(), true)) {
            throw ValidationException::withMessages([$campo.'time' => 'Esse horário está fora do expediente.']);
        }

        $ocupado = static::ativas()
            ->where('dia_da_matricula', self::DIAS[$weekday])
            ->where('horario_da_matricula', $time)
            ->when($ignorarId, fn ($q) => $q->where('id', '!=', $ignorarId))
            ->with('paciente')
            ->first();

        if ($ocupado) {
            throw ValidationException::withMessages([
                $campo.'time' => $ocupado->paciente_id === $pacienteId
                    ? 'Esse horário já é de outra matrícula deste paciente.'
                    : "Esse horário já é da matrícula de {$ocupado->paciente->nome}.",
            ]);
        }
    }

    public function paraTela(): array
    {
        return [
            'id' => $this->id,
            'contratoId' => $this->contrato_id,
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
