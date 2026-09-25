<?php

namespace App\Models;

use App\Support\Tela;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Documento extends Model
{
    protected $table = 'documentos';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = null;

    protected $fillable = ['paciente_id', 'titulo', 'nome_arquivo', 'caminho', 'tamanho'];

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    public function paraTela(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->titulo,
            'fileName' => $this->nome_arquivo,
            'size' => $this->tamanho,
            'url' => route('documentos.show', $this),
            'date' => Tela::data($this->criado_em),
        ];
    }
}
