<?php

namespace App\Models;

use App\Models\Concerns\PagamentoEstornavel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Pagamento de cobrança (recebimento). */
class Pagamento extends Model
{
    use PagamentoEstornavel;

    protected $table = 'pagamentos';

    public $timestamps = false;

    protected $fillable = ['cobranca_id', 'valor_pago', 'metodo_pagamento', 'data_pagamento', 'chave'];

    protected function casts(): array
    {
        return ['data_pagamento' => 'datetime', 'valor_pago' => 'decimal:2', 'estornado_em' => 'datetime'];
    }

    public function cobranca(): BelongsTo
    {
        return $this->belongsTo(Cobranca::class);
    }
}
