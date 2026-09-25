<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pagamento extends Model
{
    protected $table = 'pagamentos';

    public $timestamps = false;

    protected $fillable = ['cobranca_id', 'valor_pago', 'metodo_pagamento', 'data_pagamento'];

    protected function casts(): array
    {
        return ['data_pagamento' => 'datetime', 'valor_pago' => 'decimal:2'];
    }

    public function cobranca(): BelongsTo
    {
        return $this->belongsTo(Cobranca::class);
    }
}
