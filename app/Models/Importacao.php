<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Histórico da tela de Importações: o que foi trazido de .docx, para qual paciente e quando. */
class Importacao extends Model
{
    protected $table = 'importacoes';

    protected $attributes = ['anexado' => false];

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = null;

    protected $fillable = ['paciente_id', 'tipo', 'arquivo', 'anexado'];

    protected function casts(): array
    {
        return ['anexado' => 'boolean', 'criado_em' => 'datetime'];
    }

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    public function paraTela(): array
    {
        return [
            'id' => $this->id,
            'tipo' => $this->tipo,
            'arquivo' => $this->arquivo,
            'anexado' => $this->anexado,
            'patientId' => $this->paciente_id,
            'paciente' => $this->paciente?->nome,
            'quando' => $this->criado_em?->format('d/m/Y H:i'),
        ];
    }
}
