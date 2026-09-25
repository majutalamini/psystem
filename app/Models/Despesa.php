<?php

namespace App\Models;

use App\Support\Tela;
use Illuminate\Database\Eloquent\Model;

class Despesa extends Model
{
    protected $table = 'despesas';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = null;

    protected $fillable = ['descricao', 'categoria', 'valor', 'vencimento', 'pago_em', 'valor_pago', 'metodo_pagamento'];

    protected function casts(): array
    {
        return [
            'vencimento' => 'date',
            'pago_em' => 'date',
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
            'forma' => $this->metodo_pagamento ? Tela::METODOS[$this->metodo_pagamento] : null,
        ];
    }
}
