<?php

namespace App\Models\Concerns;

use App\Support\Tela;
use Illuminate\Database\Eloquent\Builder;

/** Pagamento (de cobrança ou de despesa) que pode ser estornado: estornado continua gravado e sai da soma. */
trait PagamentoEstornavel
{
    public function scopeValidos(Builder $query): void
    {
        $query->whereNull('estornado_em');
    }

    public function estornado(): bool
    {
        return $this->estornado_em !== null;
    }

    public function paraLista(): array
    {
        return [
            'id' => $this->id,
            'data' => Tela::data($this->data_pagamento),
            'valor' => (float) $this->valor_pago,
            'forma' => Tela::rotuloMetodo($this->metodo_pagamento),
            'estornado' => $this->estornado(),
            'estornadoEm' => Tela::data($this->estornado_em),
            'motivoEstorno' => $this->motivo_estorno,
        ];
    }
}
