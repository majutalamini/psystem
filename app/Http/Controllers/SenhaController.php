<?php

namespace App\Http\Controllers;

use App\Models\Psicologo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/** "Esqueci minha senha": link por e-mail e formulário da nova senha. */
class SenhaController extends Controller
{
    public function pedir()
    {
        return Inertia::render('Auth/EsqueciSenha');
    }

    public function enviarLink(Request $request)
    {
        $request->validate(['email' => 'required|email'], [], ['email' => 'e-mail']);

        // A resposta é a mesma exista ou não a conta, para não revelar quais e-mails estão cadastrados.
        Password::sendResetLink($request->only('email'));

        return back()->with('aviso', 'Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.');
    }

    public function formulario(Request $request, string $token)
    {
        return Inertia::render('Auth/RedefinirSenha', [
            'token' => $token,
            'email' => (string) $request->query('email', ''),
        ]);
    }

    public function redefinir(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ], [], ['email' => 'e-mail', 'password' => 'nova senha']);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (Psicologo $psicologo, string $senha) {
                $psicologo->forceFill(['senha_hash' => $senha, 'remember_token' => Str::random(60)])->save();
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => 'Este link não vale mais. Peça um novo em "Esqueci minha senha".',
            ]);
        }

        return redirect('/login')->with('aviso', 'Senha alterada. Entre com a nova senha.');
    }
}
