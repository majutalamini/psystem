<?php

namespace App\Models;

use App\Http\Controllers\FotoController;
use App\Notifications\RedefinirSenha;
use App\Support\Tela;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Psicologo extends Authenticatable
{
    use Notifiable;

    protected $table = 'psicologos';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = null;

    protected $authPasswordName = 'senha_hash';

    protected $fillable = ['nome', 'crp', 'email', 'telefone', 'senha_hash', 'foto'];

    protected $hidden = ['senha_hash', 'remember_token'];

    protected function casts(): array
    {
        return ['senha_hash' => 'hashed', 'revogada_em' => 'datetime'];
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new RedefinirSenha($token));
    }

    public function paraTela(): array
    {
        return [
            'nome' => $this->nome,
            'crp' => $this->crp,
            'email' => $this->email,
            'telefone' => Tela::telefone($this->telefone),
            'initials' => Tela::iniciais($this->nome),
            'photo' => FotoController::url('psicologos', $this->id, $this->foto),
        ];
    }
}
