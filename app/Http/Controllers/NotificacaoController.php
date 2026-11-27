<?php

namespace App\Http\Controllers;

use App\Services\Notificacoes;
use Illuminate\Http\Request;

class NotificacaoController extends Controller
{
    /** Dispensa uma ou várias notificações (some do sino; atrasos voltam no dia seguinte). */
    public function lidas(Request $request, Notificacoes $notificacoes)
    {
        $dados = $request->validate([
            'chaves' => 'required|array|min:1',
            'chaves.*' => 'required|string|max:120',
        ]);

        $notificacoes->marcarLidas($request->user(), $dados['chaves']);

        return back();
    }
}
