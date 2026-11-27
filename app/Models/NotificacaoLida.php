<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Notificação que a psicóloga dispensou (as notificações são calculadas; aqui fica só o que já foi lido). */
class NotificacaoLida extends Model
{
    protected $table = 'notificacoes_lidas';

    public $timestamps = false;

    protected $fillable = ['psicologo_id', 'chave', 'lida_em'];
}
