<?php

namespace App\Models;

use App\Support\Tela;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cobranca extends Model
{
    protected $table = 'cobrancas';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = null;

    protected $fillable = ['paciente_id', 'agenda_id', 'titulo', 'valor', 'vencimento', 'situacao'];

    protected function casts(): array
    {
        return ['vencimento' => 'date', 'valor' => 'decimal:2'];
    }

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    public function pagamentos(): HasMany
    {
        return $this->hasMany(Pagamento::class);
    }

    /** Soma dos pagamentos: uma cobrança pode ser recebida em partes. */
    public function recebido(): float
    {
        $pagamentos = $this->relationLoaded('pagamentos') ? $this->pagamentos : $this->pagamentos()->get();

        return round((float) $pagamentos->sum('valor_pago'), 2);
    }

    /** Quanto ainda falta receber. */
    public function saldo(): float
    {
        return max(round((float) $this->valor - $this->recebido(), 2), 0);
    }

    /** "Atrasado" não é gravado: é pendente com vencimento no passado. Recebida em parte continua pendente. */
    public function status(): string
    {
        return match (true) {
            $this->situacao === 'pago' => 'Pago',
            $this->vencimento->isBefore(today()) => 'Atrasado',
            default => 'Pendente',
        };
    }

    public function paraTela(): array
    {
        $pagamento = $this->relationLoaded('pagamentos') ? $this->pagamentos->last() : null;

        return [
            'id' => $this->id,
            'patientId' => $this->paciente_id,
            'paciente' => $this->relationLoaded('paciente') ? $this->paciente->nome : null,
            'referencia' => $this->titulo,
            'valor' => (float) $this->valor,
            'vencimento' => Tela::data($this->vencimento),
            'status' => $this->status(),
            'recebimento' => Tela::data($pagamento?->data_pagamento),
            'recebido' => $pagamento ? $this->recebido() : null,
            'saldo' => $this->situacao === 'pago' ? 0.0 : $this->saldo(),
            'forma' => Tela::rotuloMetodo($pagamento?->metodo_pagamento),
        ];
    }
}
