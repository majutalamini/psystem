<?php

use App\Models\Matricula;
use App\Services\AgendaMatricula;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('agenda:gerar', function (AgendaMatricula $agenda) {
    $total = 0;
    foreach (Matricula::with('paciente')->get() as $matricula) {
        $total += $agenda->gerar($matricula);
    }
    $this->info("{$total} consulta(s) criada(s) a partir das matrículas.");
})->purpose('Completa a agenda com as consultas das matrículas das próximas semanas');

Schedule::command('agenda:gerar')->dailyAt('01:00');
