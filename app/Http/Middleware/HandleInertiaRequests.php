<?php

namespace App\Http\Middleware;

use App\Models\Configuracao;
use App\Models\Paciente;
use App\Models\Responsavel;
use App\Services\Notificacoes;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    /** Dados compartilhados: psicóloga logada, pacientes, horários e avisos. */
    public function share(Request $request): array
    {
        $logado = $request->user();

        return [
            ...parent::share($request),
            'auth' => fn () => ['user' => $logado?->paraTela()],
            'patients' => fn () => $logado
                ? Paciente::comResumo()->get()->map->paraTela()
                : [],
            'hours' => fn () => $logado ? Configuracao::atual()->horarios() : [],
            'guardianOptions' => fn () => $logado
                ? Responsavel::orderBy('nome')->get(['id', 'nome', 'telefone'])->map(fn ($r) => ['id' => $r->id, 'name' => $r->nome])
                : [],
            'notifications' => fn () => $logado ? app(Notificacoes::class)->lista($logado) : [],
            'flash' => fn () => [
                'aviso' => $request->session()->get('aviso'),
                'sucesso' => $request->session()->get('sucesso'),
                'erro' => $request->session()->get('erro'),
                'novoResponsavel' => $request->session()->get('novoResponsavel'),
            ],
        ];
    }
}
