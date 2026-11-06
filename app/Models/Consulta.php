<?php

namespace App\Models;

use App\Support\Tela;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class Consulta extends Model
{
    protected $table = 'agenda';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = null;

    /** Rótulos da tela de Agenda. "Matriculado" = gerado pela matrícula; avulsa aparece como "Agendado". */
    public const STATUS = [
        'agendado' => 'Matriculado',
        'confirmado' => 'Confirmado',
        'realizado' => 'Realizado',
        'falta' => 'Falta',
        'cancelado' => 'Cancelado',
    ];

    /**
     * Transições de status permitidas na agenda: a matrícula já garante o horário, então só existem "Falta" e "Cancelado"
     * (a falta também vale para quem tem matrícula, direto de "Matriculado"). Os demais status só existem em registros antigos.
     */
    public const TRANSICOES = [
        'agendado' => ['falta', 'cancelado'],
        'confirmado' => ['falta', 'cancelado'],
        'realizado' => ['falta', 'cancelado'],
        'falta' => ['cancelado'],
        'cancelado' => [],
    ];

    protected $fillable = [
        'paciente_id', 'matricula_id', 'data_hora_consulta', 'duracao_minutos', 'modalidade', 'status', 'valor', 'aviso_enviado_em',
    ];

    protected function casts(): array
    {
        return ['data_hora_consulta' => 'datetime', 'aviso_enviado_em' => 'datetime'];
    }

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    public function matricula(): BelongsTo
    {
        return $this->belongsTo(Matricula::class);
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

    public function rotuloStatus(): string
    {
        if ($this->status === 'agendado' && $this->matricula_id === null) {
            return 'Agendado';
        }

        return self::STATUS[$this->status];
    }

    public function transicaoPermitida(string $novoStatus): bool
    {
        return in_array($novoStatus, self::TRANSICOES[$this->status] ?? [], true);
    }

    /**
     * Muda o status. Cancelar a consulta cancela também a cobrança dela (a da consulta avulsa) se ainda estiver em aberto
     * e sem nenhum pagamento; falta não cancela: a sessão continua cobrada. As mensalidades da matrícula não dependem da agenda.
     */
    public function alterarStatus(string $status): void
    {
        if (! $this->transicaoPermitida($status)) {
            $de = $this->rotuloStatus();
            $para = self::STATUS[$status] ?? $status;

            throw ValidationException::withMessages([
                'status' => "Não é permitido alterar o status de \"{$de}\" para \"{$para}\".",
            ]);
        }

        DB::transaction(function () use ($status) {
            $this->update(['status' => $status]);

            if ($status === 'cancelado') {
                $cobranca = $this->cobranca()->first();
                if ($cobranca?->situacao === 'pendente' && ! $cobranca->pagamentos()->exists()) {
                    $cobranca->update(['situacao' => 'cancelado']);
                }
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
            'status' => $this->rotuloStatus(),
            'statusKey' => $this->status,
            'recurring' => $this->matricula_id !== null,
        ];
    }
}
