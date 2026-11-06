<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/** Uma sessão aberta antes da revogação perde o acesso na próxima requisição. */
class ContaAtiva
{
    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();
        if ($usuario !== null && $usuario->revogada_em !== null) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect('/login')->with('erro', 'Seu acesso foi revogado. Fale com a responsável pelo consultório.');
        }

        return $next($request);
    }
}
