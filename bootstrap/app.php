<?php

use App\Http\Middleware\CabecalhosSeguros;
use App\Http\Middleware\ContaAtiva;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\MeasureRequest;
use App\Http\Middleware\RegistrarRequisicao;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Servidor (etapa 5): confia no proxy HTTPS da rede interna do Docker, só quando configurado.
        if ($proxies = env('TRUSTED_PROXIES')) {
            $middleware->trustProxies(at: array_map('trim', explode(',', $proxies)));
        }
        $middleware->prepend(RegistrarRequisicao::class);
        $middleware->append(MeasureRequest::class);
        $middleware->append(CabecalhosSeguros::class);
        $middleware->web(append: [
            ContaAtiva::class,
            HandleInertiaRequests::class,
        ]);
        $middleware->redirectGuestsTo('/login');
        $middleware->redirectUsersTo('/');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // A mensagem padrão de QueryException traz os valores (bindings), que podem ser dados clínicos.
        // O log guarda só o SQL com marcadores, o código e a conexão.
        $exceptions->report(function (QueryException $e) {
            Log::error('Falha de banco de dados', ['codigo' => $e->getCode(), 'sql' => $e->getSql(), 'conexao' => $e->getConnectionName()]);
        })->stop();

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->respond(function (Response $response, Throwable $e, Request $request): Response {
            $mensagens = [
                403 => 'Você não tem permissão para fazer isso.',
                404 => 'Não encontramos o que você procurava.',
                419 => 'Sua sessão expirou. Recarregue a página e tente de novo.',
                429 => 'Muitas tentativas seguidas. Aguarde um instante e tente de novo.',
                500 => 'Algo deu errado no sistema. Tente de novo em instantes.',
            ];

            $status = $response->getStatusCode();
            if (! isset($mensagens[$status])) {
                return $response;
            }

            if ($request->hasSession()) {
                $request->session()->flash('erro', $mensagens[$status]);
            }

            if ($request->expectsJson()) {
                return response()->json(['message' => $mensagens[$status]], $status);
            }

            return response($mensagens[$status], $status);
        });
    })->create();
