<?php

use App\Models\Matricula;
use App\Services\AgendaMatricula;
use App\Services\Avisos;
use App\Services\AvisosWhatsapp;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('agenda:gerar', function (AgendaMatricula $agenda) {
    $total = 0;
    foreach (Matricula::with('paciente')->get() as $matricula) {
        $total += $agenda->gerar($matricula);
    }
    $this->info("{$total} consulta(s) criada(s) a partir das matrículas.");
})->purpose('Completa a agenda com as consultas das matrículas das próximas semanas');

Artisan::command('avisos:consultas', function (Avisos $avisos) {
    $this->info($avisos->consultas().' aviso(s) de consulta enviado(s).');
})->purpose('Avisa a psicóloga por e-mail cerca de 1 hora antes de cada consulta');

Artisan::command('avisos:vencimentos', function (Avisos $avisos) {
    $this->info($avisos->vencimentos().' conta(s) avisada(s).');
})->purpose('Avisa a psicóloga por e-mail das contas que vencem nos próximos 3 dias');

Artisan::command('whatsapp:lembretes', function (AvisosWhatsapp $whatsapp) {
    $this->info($whatsapp->lembretes().' lembrete(s) de sessão pelo WhatsApp.');
})->purpose('Manda pelo WhatsApp o lembrete das consultas de amanhã');

Artisan::command('whatsapp:cobrancas', function (AvisosWhatsapp $whatsapp) {
    $this->info($whatsapp->cobrancas().' cobrança(s) pelo WhatsApp.');
})->purpose('Manda pelo WhatsApp as cobranças que vencem daqui a "dias antes" (Configurações)');

Schedule::command('agenda:gerar')->dailyAt('01:00');
Schedule::command('whatsapp:lembretes')->dailyAt('09:00');
Schedule::command('whatsapp:cobrancas')->dailyAt('09:00');
Schedule::command('avisos:consultas')->everyMinute();
Schedule::command('avisos:vencimentos')->dailyAt('07:00');
