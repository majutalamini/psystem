<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Quem fez qual ação em qual registro. Nunca guarda conteúdo clínico nem valores digitados. */
class RegistroAcao extends Model
{
    protected $table = 'registros_acao';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = null;

    protected $fillable = ['psicologo_id', 'acao', 'alvo_tipo', 'alvo_id'];

    protected function casts(): array
    {
        return ['criado_em' => 'datetime'];
    }

    /** Registra a ação do usuário autenticado; fora de uma requisição autenticada (comandos) não registra. */
    public static function registrar(string $acao, Model $alvo): void
    {
        $psicologoId = auth()->id();
        if ($psicologoId === null) {
            return;
        }

        static::create([
            'psicologo_id' => $psicologoId,
            'acao' => $acao,
            'alvo_tipo' => $alvo->getTable(),
            'alvo_id' => $alvo->getKey(),
        ]);
    }
}
