<?php

namespace App\Providers;

use App\Services\WhatsApp\Canal;
use App\Services\WhatsApp\CanalEvolution;
use App\Services\WhatsApp\CanalTeste;
use App\Services\WhatsApp\CanalTwilio;
use App\Services\WhatsApp\EvolutionApi;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // WHATSAPP_MODO=teste só registra as mensagens; =evolution ou =twilio enviam de verdade.
        $this->app->bind(Canal::class, fn () => match (config('services.whatsapp.modo')) {
            'evolution' => new CanalEvolution(new EvolutionApi),
            'twilio' => new CanalTwilio,
            default => new CanalTeste,
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
