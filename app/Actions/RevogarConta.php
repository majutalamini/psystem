<?php

namespace App\Actions;

use App\Models\Psicologo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Revogação operacional: a conta deixa de entrar, as sessões abertas e o "manter conectado" deixam de
 * valer e links de recuperação de senha pendentes são descartados. A recuperação de senha não reativa
 * a conta; só reativar() devolve o acesso.
 */
class RevogarConta
{
    public static function revogar(Psicologo $psicologo): void
    {
        DB::transaction(function () use ($psicologo) {
            $psicologo->forceFill(['revogada_em' => now(), 'remember_token' => Str::random(60)])->save();
            DB::table(config('session.table', 'sessions'))->where('user_id', $psicologo->id)->delete();
            DB::table(config('auth.passwords.users.table', 'password_reset_tokens'))->where('email', $psicologo->email)->delete();
        });
    }

    public static function reativar(Psicologo $psicologo): void
    {
        $psicologo->forceFill(['revogada_em' => null])->save();
    }
}
