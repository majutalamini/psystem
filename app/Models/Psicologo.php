<?php

namespace App\Models;

use App\Support\Tela;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Storage;

class Psicologo extends Authenticatable
{
    protected $table = 'psicologos';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = null;

    protected $authPasswordName = 'senha_hash';

    protected $fillable = ['nome', 'crp', 'email', 'telefone', 'senha_hash', 'foto'];

    protected $hidden = ['senha_hash', 'remember_token'];

    protected function casts(): array
    {
        return ['senha_hash' => 'hashed'];
    }

    public function paraTela(): array
    {
        return [
            'nome' => $this->nome,
            'crp' => $this->crp,
            'email' => $this->email,
            'telefone' => $this->telefone,
            'initials' => Tela::iniciais($this->nome),
            'photo' => $this->foto ? Storage::url($this->foto) : null,
        ];
    }
}
