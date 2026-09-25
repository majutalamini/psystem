<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AnamneseModelo extends Model
{
    protected $table = 'anamnese_modelos';

    public $timestamps = false;

    protected $fillable = ['titulo'];

    public function perguntas(): HasMany
    {
        return $this->hasMany(AnamnesePergunta::class)->orderBy('id');
    }

    /** Perguntas agrupadas por categoria, no formato das seções do formulário do front. */
    public function secoes(): array
    {
        return $this->perguntas
            ->groupBy('categoria')
            ->map(fn ($perguntas, $categoria) => [
                'title' => $categoria,
                'fields' => $perguntas->map(fn ($p) => [
                    'key' => (string) $p->id,
                    'label' => $p->texto_pergunta,
                ])->values()->all(),
            ])
            ->values()
            ->all();
    }
}
