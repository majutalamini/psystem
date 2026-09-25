<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnamneseResposta extends Model
{
    protected $table = 'anamnese_respostas';

    public $timestamps = false;

    protected $fillable = ['paciente_id', 'psicologo_id', 'pergunta_id', 'valor_resposta', 'data_preenchimento'];

    protected function casts(): array
    {
        return ['data_preenchimento' => 'datetime'];
    }

    public function pergunta(): BelongsTo
    {
        return $this->belongsTo(AnamnesePergunta::class, 'pergunta_id');
    }
}
