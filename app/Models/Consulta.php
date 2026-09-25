<?php

namespace App\Models;

use App\Support\Tela;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;

class Consulta extends Model
{
    protected $table = 'agenda';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = null;

    /** Rótulos da tela de Agenda. "Pendente" = agendado, ainda não confirmado. */
    public const STATUS = [
        'agendado' => 'Pendente',
        'confirmado' => 'Confirmado',
        'realizado' => 'Realizado',
        'falta' => 'Falta',
        'cancelado' => 'Cancelado',
    ];

    protected $fillable = [
        'paciente_id', 'matricula_id', 'data_hora_consulta', 'duracao_minutos', 'modalidade', 'status',
    ];

    protected function casts(): array
    {
        return ['data_hora_consulta' => 'datetime'];
    }

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    public function cobranca(): HasOne
    {
        return $this->hasOne(Cobranca::class, 'agenda_id');
    }

    /** Já existe consulta ativa (não cancelada) nesse horário? */
    public static function horarioOcupado($dataHora, ?int $ignorarId = null): bool
    {
        return static::where('data_hora_consulta', $dataHora)
            ->where('status', '!=', 'cancelado')
            ->when($ignorarId, fn ($q) => $q->where('id', '!=', $ignorarId))
            ->exists();
    }

    /**
     * Muda o status e mantém a cobrança da sessão em dia:
     * virou "realizado" → cobrança pendente com o valor da matrícula, vencendo no dia da sessão;
     * saiu de "realizado" → a cobrança pendente é cancelada (uma já paga não é mexida).
     */
    public function alterarStatus(string $status): void
    {
        DB::transaction(function () use ($status) {
            $anterior = $this->status;
            $this->update(['status' => $status]);

            $cobranca = $this->cobranca()->first();

            if ($status === 'realizado' && $anterior !== 'realizado') {
                if ($cobranca) {
                    if ($cobranca->situacao === 'cancelado') {
                        $cobranca->update(['situacao' => 'pendente']);
                    }

                    return;
                }

                $valor = $this->paciente->matricula?->valor_sessao;
                if ($valor === null) {
                    return; // sem matrícula não há valor de sessão definido
                }

                $this->cobranca()->create([
                    'paciente_id' => $this->paciente_id,
                    'titulo' => 'Sessão — '.$this->data_hora_consulta->format('d/m/Y'),
                    'valor' => $valor,
                    'vencimento' => $this->data_hora_consulta->toDateString(),
                ]);
            }

            if ($anterior === 'realizado' && $status !== 'realizado' && $cobranca?->situacao === 'pendente') {
                $cobranca->update(['situacao' => 'cancelado']);
            }
        });
    }

    public function paraTela(): array
    {
        return [
            'id' => $this->id,
            'patientId' => $this->paciente_id,
            'name' => $this->paciente->nome,
            'color' => Tela::cor($this->paciente_id),
            'date' => Tela::data($this->data_hora_consulta),
            'time' => $this->data_hora_consulta->format('H:i'),
            'type' => Tela::MODALIDADES[$this->modalidade],
            'status' => self::STATUS[$this->status],
            'statusKey' => $this->status,
            'recurring' => $this->matricula_id !== null,
        ];
    }
}
