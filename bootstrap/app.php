<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);
        $middleware->redirectGuestsTo('/login');
        $middleware->redirectUsersTo('/');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
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
