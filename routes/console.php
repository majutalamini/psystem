<?php

use App\Models\Matricula;
use App\Models\Paciente;
use App\Services\AgendaMatricula;
use App\Services\Avisos;
use App\Services\Contratos;
use App\Services\DespesasRecorrentes;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('agenda:gerar', function (AgendaMatricula $agenda) {
    $total = 0;
    foreach (Matricula::ativas()->with('paciente')->get() as $matricula) {
        $total += $agenda->gerar($matricula);
    }
    $this->info("{$total} consulta(s) criada(s) a partir das matrículas.");
})->purpose('Completa a agenda com as consultas das matrículas dos próximos 2 meses');

Artisan::command('contratos:processar', function (Contratos $contratos) {
    $r = $contratos->processar();
    $this->info("{$r['renovados']} pacote(s) renovado(s), {$r['bloqueados']} contrato(s) bloqueado(s), {$r['desbloqueados']} desbloqueado(s).");
})->purpose('Renova os pacotes que terminaram (lançando a mensalidade) e bloqueia/desbloqueia contratos por inadimplência');

Artisan::command('despesas:gerar', function (DespesasRecorrentes $recorrentes) {
    $this->info($recorrentes->gerarDoMes().' conta(s) a pagar recorrente(s) lançada(s).');
})->purpose('Lança a conta a pagar do mês de cada recorrência ativa, sem duplicar');

Artisan::command('pacientes:sincronizar-status', function () {
    $alterados = 0;
    foreach (Paciente::all() as $paciente) {
        $paciente->sincronizarStatus();
        $alterados += $paciente->wasChanged('status_paciente');
    }
    $this->info("{$alterados} paciente(s) com o status acertado pelos contratos.");
})->purpose('Deixa cada paciente ativo, bloqueado ou inativo conforme o contrato');

Artisan::command('avisos:consultas', function (Avisos $avisos) {
    $this->info($avisos->consultas().' aviso(s) de consulta enviado(s).');
})->purpose('Avisa a psicóloga por e-mail cerca de 1 hora antes de cada consulta');

Artisan::command('avisos:vencimentos', function (Avisos $avisos) {
    $this->info($avisos->vencimentos().' conta(s) avisada(s).');
})->purpose('Avisa a psicóloga por e-mail das contas que vencem nos próximos 3 dias');

Schedule::command('contratos:processar')->dailyAt('00:30');
Schedule::command('agenda:gerar')->dailyAt('01:00');
Schedule::command('despesas:gerar')->dailyAt('01:20');
Schedule::command('avisos:consultas')->everyMinute();
Schedule::command('avisos:vencimentos')->dailyAt('07:00');
