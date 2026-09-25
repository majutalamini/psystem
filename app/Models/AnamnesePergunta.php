<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnamnesePergunta extends Model
{
    protected $table = 'anamnese_perguntas';

    public $timestamps = false;

    protected $fillable = ['anamnese_modelo_id', 'categoria', 'texto_pergunta', 'tipo_pergunta'];

    public function modelo(): BelongsTo
    {
        return $this->belongsTo(AnamneseModelo::class, 'anamnese_modelo_id');
    }
}
