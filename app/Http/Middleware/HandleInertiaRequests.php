<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    /** Somente identidade e avisos; dados de domínio pertencem a cada página. */
    public function share(Request $request): array
    {
        $logado = $request->user();

        return [
            ...parent::share($request),
            'auth' => fn () => ['user' => $logado?->paraTela()],
            'flash' => fn () => [
                'aviso' => $request->session()->get('aviso'),
                'sucesso' => $request->session()->get('sucesso'),
                'erro' => $request->session()->get('erro'),
            ],
        ];
    }
}
