<?php

namespace App\Providers;

use App\Models\Psicologo;
use App\Support\RequestMetrics;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->scoped(RequestMetrics::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('diagnostics.enabled') && $this->app->environment('local', 'testing')) {
            // Um listener por aplicação, sem armazenar SQL, bindings ou conteúdo clínico.
            DB::listen(fn (QueryExecuted $query) => app(RequestMetrics::class)->record($query->time));
        }

        // Painel do Pulse (/pulse): qualquer conta ativa do consultório; conta revogada não vê.
        Gate::define('viewPulse', fn ($usuario) => $usuario instanceof Psicologo && $usuario->revogada_em === null);
    }
}
