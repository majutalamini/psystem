<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Identifica cada requisição (X-Request-ID, aceito do proxy ou gerado) e grava uma linha estruturada
 * em storage/logs/requisicoes-*.log. O identificador também entra no contexto de todos os outros logs.
 * Registra a rota pelo padrão (/pacientes/{paciente}), nunca a URL com IDs, parâmetros ou corpo.
 */
class RegistrarRequisicao
{
    public function handle(Request $request, Closure $next): Response
    {
        $recebido = (string) $request->headers->get('X-Request-ID', '');
        $id = preg_match('/^[A-Za-z0-9._-]{8,64}$/', $recebido) ? $recebido : (string) Str::uuid();
        Log::shareContext(['request_id' => $id]); // vale para todos os canais, inclusive o de requisições

        $consultas = 0;
        DB::listen(function (QueryExecuted $_) use (&$consultas) {
            $consultas++;
        });
        $inicio = microtime(true);

        $response = $next($request);
        $response->headers->set('X-Request-ID', $id);

        Log::channel('requisicoes')->info('requisicao', [
            'metodo' => $request->method(),
            'rota' => $request->route()?->uri() ?? 'sem-rota',
            'status' => $response->getStatusCode(),
            'duracao_ms' => round((microtime(true) - $inicio) * 1000, 1),
            'consultas' => $consultas,
            'memoria_mb' => round(memory_get_peak_usage(true) / 1048576, 1),
            'usuario_id' => $request->user()?->getAuthIdentifier(),
        ]);

        return $response;
    }
}
