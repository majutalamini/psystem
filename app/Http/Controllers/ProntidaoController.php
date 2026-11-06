<?php

namespace App\Http\Controllers;

use App\Support\Prontidao;
use Illuminate\Http\JsonResponse;

/**
 * GET /prontidao, para o monitor externo. Público, mas só com ok/falha por verificação (os detalhes,
 * que podem citar host ou usuário do banco, ficam no comando operacao:status).
 * 503 quando banco ou armazenamento falham; scheduler, fila e backup aparecem como alertas.
 */
class ProntidaoController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $verificacoes = Prontidao::verificar();
        $pronto = collect($verificacoes)->every(fn ($v) => $v['ok'] || ! $v['critico']);

        return response()->json([
            'status' => $pronto ? 'pronto' : 'indisponivel',
            'alertas' => collect($verificacoes)->reject(fn ($v) => $v['ok'])->keys()->values(),
            'verificacoes' => collect($verificacoes)->map(fn ($v) => $v['ok'] ? 'ok' : 'falha'),
        ], $pronto ? 200 : 503)->header('Cache-Control', 'no-store');
    }
}
