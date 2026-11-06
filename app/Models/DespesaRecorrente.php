<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Conta a pagar que se repete todo mês no mesmo dia; as contas de cada mês são linhas de `despesas`. */
class DespesaRecorrente extends Model
{
    protected $table = 'despesas_recorrentes';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = null;

    protected $fillable = ['descricao', 'categoria', 'valor', 'dia', 'inicio', 'ativa'];

    protected function casts(): array
    {
        return ['inicio' => 'date', 'valor' => 'decimal:2', 'ativa' => 'boolean'];
    }

    public function despesas(): HasMany
    {
        return $this->hasMany(Despesa::class, 'recorrente_id');
    }
}
