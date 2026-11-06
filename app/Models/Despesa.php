<?php

namespace App\Models;

use App\Support\Tela;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Despesa extends Model
{
    protected $table = 'despesas';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = null;

    protected $fillable = [
        'descricao', 'categoria', 'valor', 'vencimento', 'pago_em', 'valor_pago', 'metodo_pagamento',
        'recorrente_id', 'competencia', 'cancelada_em',
    ];

    /** Contas canceladas somem de todas as telas e relatórios (para ver todas: withoutGlobalScopes). */
    protected static function booted(): void
    {
        static::addGlobalScope('ativas', fn (Builder $q) => $q->whereNull('cancelada_em'));
    }

    public function recorrencia(): BelongsTo
    {
        return $this->belongsTo(DespesaRecorrente::class, 'recorrente_id');
    }

    protected function casts(): array
    {
        return [
            'vencimento' => 'date',
            'pago_em' => 'date',
            'competencia' => 'date',
            'cancelada_em' => 'date',
            'valor' => 'decimal:2',
            'valor_pago' => 'decimal:2',
        ];
    }

    public function status(): string
    {
        return match (true) {
            $this->pago_em !== null => 'Pago',
            $this->vencimento->isBefore(today()) => 'Atrasado',
            default => 'Pendente',
        };
    }

    public function paraTela(): array
    {
        return [
            'id' => $this->id,
            'descricao' => $this->descricao,
            'categoria' => $this->categoria,
            'valor' => (float) $this->valor,
            'vencimento' => Tela::data($this->vencimento),
            'status' => $this->status(),
            'pagamento' => Tela::data($this->pago_em),
            'pago' => $this->valor_pago !== null ? (float) $this->valor_pago : null,
            'forma' => Tela::rotuloMetodo($this->metodo_pagamento),
            'recorrente' => $this->recorrente_id !== null,
            'recorrenciaAtiva' => $this->recorrente_id !== null && (bool) $this->recorrencia?->ativa,
        ];
    }
}
