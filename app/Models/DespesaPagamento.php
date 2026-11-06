<?php

namespace App\Models;

use App\Models\Concerns\PagamentoEstornavel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Pagamento de despesa (conta a pagar do consultório). */
class DespesaPagamento extends Model
{
    use PagamentoEstornavel;

    protected $table = 'despesa_pagamentos';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = null;

    protected $fillable = ['despesa_id', 'valor_pago', 'metodo_pagamento', 'data_pagamento', 'chave'];

    protected function casts(): array
    {
        return ['data_pagamento' => 'datetime', 'valor_pago' => 'decimal:2', 'estornado_em' => 'datetime'];
    }

    public function despesa(): BelongsTo
    {
        return $this->belongsTo(Despesa::class);
    }
}
