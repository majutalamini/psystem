<?php

use App\Models\Matricula;
use App\Models\Paciente;
use App\Services\AgendaMatricula;
use App\Services\Avisos;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('agenda:gerar', function (AgendaMatricula $agenda) {
    $total = 0;
    foreach (Matricula::ativas()->with('paciente')->get() as $matricula) {
        $total += $agenda->gerar($matricula);
    }
    $this->info("{$total} consulta(s) criada(s) a partir das matrículas.");
})->purpose('Completa a agenda com as consultas das matrículas das próximas semanas');

Artisan::command('pacientes:sincronizar-status', function () {
    $alterados = 0;
    foreach (Paciente::all() as $paciente) {
        $paciente->sincronizarStatus();
        $alterados += $paciente->wasChanged('status_paciente');
    }
    $this->info("{$alterados} paciente(s) com o status acertado pelas matrículas.");
})->purpose('Deixa cada paciente ativo se tiver matrícula ativa e inativo se não tiver');

Artisan::command('avisos:consultas', function (Avisos $avisos) {
    $this->info($avisos->consultas().' aviso(s) de consulta enviado(s).');
})->purpose('Avisa a psicóloga por e-mail cerca de 1 hora antes de cada consulta');

Artisan::command('avisos:vencimentos', function (Avisos $avisos) {
    $this->info($avisos->vencimentos().' conta(s) avisada(s).');
})->purpose('Avisa a psicóloga por e-mail das contas que vencem nos próximos 3 dias');

Schedule::command('agenda:gerar')->dailyAt('01:00');
Schedule::command('avisos:consultas')->everyMinute();
Schedule::command('avisos:vencimentos')->dailyAt('07:00');
