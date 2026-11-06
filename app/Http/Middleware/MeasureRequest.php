<?php

namespace App\Http\Middleware;

use App\Support\RequestMetrics;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MeasureRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        $requested = $request->header('X-Psystem-Diagnostics') === '1'
            || (config('database.connections.pgsql.database') === 'psystem_diagnostic'
                && $request->cookie('__psystem_metrics') === '1');
        if (! config('diagnostics.enabled') || ! app()->environment('local', 'testing')
            || ! $requested) {
            return $next($request);
        }

        $metrics = app(RequestMetrics::class);
        $metrics->start();
        $start = microtime(true);

        try {
            $response = $next($request);
            $application = (microtime(true) - $start) * 1000;
            // O bootstrap inclui autoload e boot dos providers, antes deste middleware.
            $bootstrap = defined('LARAVEL_START') ? max(0, ($start - LARAVEL_START) * 1000) : 0;
            $response->headers->set('Server-Timing', sprintf(
                'bootstrap;dur=%.2f, app;dur=%.2f, sql;dur=%.2f',
                $bootstrap, $application, $metrics->sqlMilliseconds,
            ));
            $response->headers->set('X-Psystem-Sql-Count', (string) $metrics->queries);
            $response->headers->set('X-Psystem-Peak-Memory', (string) memory_get_peak_usage(true));
            $response->headers->set('Cache-Control', 'no-store, private');

            return $response;
        } finally {
            $metrics->active = false;
        }
    }
}
