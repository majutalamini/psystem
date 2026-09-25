<?php

namespace App\Http\Middleware;

use App\Models\Configuracao;
use App\Models\Paciente;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    /**
     * Dados que toda tela usa: psicóloga logada, lista de pacientes (seletores e atalho do WhatsApp)
     * e os textos do WhatsApp. Consultório de uma profissional só, então a lista é pequena.
     */
    public function share(Request $request): array
    {
        $logado = $request->user();

        return [
            ...parent::share($request),
            'auth' => fn () => ['user' => $logado?->paraTela()],
            'patients' => fn () => $logado
                ? Paciente::comResumo()->get()->map->paraTela()
                : [],
            'whatsapp' => fn () => $logado ? Configuracao::atual()->whatsapp() : null,
            'hours' => fn () => $logado ? Configuracao::atual()->horarios() : [],
            'flash' => fn () => ['aviso' => $request->session()->get('aviso')],
        ];
    }
}
