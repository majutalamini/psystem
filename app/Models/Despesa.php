<?php

namespace App\Models;

use App\Support\Tela;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Conta a pagar. Pode ser paga em partes: fica paga quando a soma dos pagamentos válidos chega ao valor. */
class Despesa extends Model
{
    protected $table = 'despesas';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = null;

    protected $fillable = [
        'descricao', 'categoria', 'valor', 'vencimento',
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
            'competencia' => 'date',
            'cancelada_em' => 'date',
            'valor' => 'decimal:2',
        ];
    }

    public function pagamentos(): HasMany
    {
        return $this->hasMany(DespesaPagamento::class)->orderBy('data_pagamento')->orderBy('id');
    }

    /** Soma dos pagamentos não estornados. */
    public function pago(): float
    {
        $pagamentos = $this->relationLoaded('pagamentos') ? $this->pagamentos : $this->pagamentos()->get();

        return round((float) $pagamentos->whereNull('estornado_em')->sum('valor_pago'), 2);
    }

    /** Saldo = valor original − soma dos pagamentos válidos. */
    public function saldo(): float
    {
        return max(round((float) $this->valor - $this->pago(), 2), 0);
    }

    public function status(): string
    {
        return match (true) {
            $this->saldo() <= 0 => 'Pago',
            $this->vencimento->isBefore(today()) => 'Atrasado',
            default => 'Pendente',
        };
    }

    public function paraTela(): array
    {
        $pagamentos = $this->relationLoaded('pagamentos') ? $this->pagamentos : $this->pagamentos()->get();
        $ultimo = $pagamentos->whereNull('estornado_em')->last();

        return [
            'id' => $this->id,
            'descricao' => $this->descricao,
            'categoria' => $this->categoria,
            'valor' => (float) $this->valor,
            'vencimento' => Tela::data($this->vencimento),
            'status' => $this->status(),
            'pagamento' => Tela::data($ultimo?->data_pagamento),
            'pago' => $ultimo ? $this->pago() : null,
            'saldo' => $this->saldo(),
            'forma' => Tela::rotuloMetodo($ultimo?->metodo_pagamento),
            'pagamentos' => $pagamentos->map->paraLista()->values()->all(),
            'recorrente' => $this->recorrente_id !== null,
            'recorrenciaAtiva' => $this->recorrente_id !== null && (bool) $this->recorrencia?->ativa,
        ];
    }
}
