<?php

use App\Actions\RevogarConta;
use App\Models\Paciente;
use App\Models\Psicologo;
use App\Services\AgendaMatricula;
use App\Services\Avisos;
use App\Services\DespesasRecorrentes;
use App\Services\Mensalidades;
use App\Support\Prontidao;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Storage;

Artisan::command('agenda:gerar', function (AgendaMatricula $agenda) {
    $total = $agenda->gerarJanela();
    $this->info("{$total} consulta(s) criada(s) a partir das matrículas.");
})->purpose('Completa a agenda com as consultas das matrículas dos próximos 2 meses');

Artisan::command('mensalidades:gerar', function (Mensalidades $mensalidades) {
    $this->info($mensalidades->gerarDoMes().' mensalidade(s) lançada(s) no financeiro.');
})->purpose('Lança no financeiro a mensalidade do mês de cada matrícula ativa, sem duplicar');

Artisan::command('despesas:gerar', function (DespesasRecorrentes $recorrentes) {
    $this->info($recorrentes->gerarDoMes().' conta(s) a pagar recorrente(s) lançada(s).');
})->purpose('Lança a conta a pagar do mês de cada recorrência ativa, sem duplicar');

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

Artisan::command('psicologo:revogar {email}', function (string $email) {
    $psicologo = Psicologo::where('email', $email)->first();
    if (! $psicologo) {
        $this->error('Conta não encontrada.');

        return 1;
    }
    RevogarConta::revogar($psicologo);
    $this->info("Acesso de {$psicologo->nome} revogado: sessões encerradas e login bloqueado.");
})->purpose('Revoga o acesso de uma conta (sessões, "manter conectado", login e recuperação de senha)');

Artisan::command('psicologo:reativar {email}', function (string $email) {
    $psicologo = Psicologo::where('email', $email)->first();
    if (! $psicologo) {
        $this->error('Conta não encontrada.');

        return 1;
    }
    RevogarConta::reativar($psicologo);
    $this->info("Acesso de {$psicologo->nome} reativado.");
})->purpose('Devolve o acesso a uma conta revogada');

// Uma vez, depois de atualizar: fotos antigas do disco público passam para o disco privado.
Artisan::command('fotos:tornar-privadas', function () {
    $movidas = 0;
    foreach ([Paciente::whereNotNull('foto')->get(), Psicologo::whereNotNull('foto')->get()] as $donos) {
        foreach ($donos as $dono) {
            if (Storage::exists($dono->foto) || ! Storage::disk('public')->exists($dono->foto)) {
                continue;
            }
            Storage::put($dono->foto, Storage::disk('public')->get($dono->foto));
            Storage::disk('public')->delete($dono->foto);
            $movidas++;
        }
    }
    $this->info("{$movidas} foto(s) movida(s) para o disco privado.");
})->purpose('Move as fotos antigas do disco público para o privado');

// Situação operacional detalhada (etapa 4), sem dados de pacientes. Código 1 se banco ou armazenamento falham.
Artisan::command('operacao:status', function () {
    $verificacoes = Prontidao::verificar();
    foreach ($verificacoes as $nome => $v) {
        $this->line(sprintf('%-14s %-5s %s%s', $nome, $v['ok'] ? 'ok' : 'FALHA', $v['detalhe'], ($v['ok'] || $v['critico']) ? '' : ' (alerta)'));
    }
    $bytes = fn ($n) => number_format($n / 1048576, 1, ',', '.').' MB';
    $banco = DB::selectOne('select pg_database_size(current_database()) as tamanho, (select count(*) from pg_stat_activity where datname = current_database()) as conexoes, (select count(*) from pg_locks where not granted) as bloqueios_esperando, (select count(*) from pg_stat_activity where datname = current_database() and state = \'active\' and now() - query_start > interval \'5 seconds\') as consultas_lentas');
    $anexos = collect(Storage::allFiles('documentos'))->sum(fn ($f) => Storage::size($f));
    $fotos = collect(Storage::allFiles('fotos'))->sum(fn ($f) => Storage::size($f));
    $this->line("banco          {$bytes($banco->tamanho)}, {$banco->conexoes} conexão(ões), {$banco->bloqueios_esperando} bloqueio(s) esperando, {$banco->consultas_lentas} consulta(s) > 5 s");
    $this->line("arquivos       documentos {$bytes($anexos)}, fotos {$bytes($fotos)}, livre no disco {$bytes(disk_free_space(storage_path()))}");

    return collect($verificacoes)->every(fn ($v) => $v['ok'] || ! $v['critico']) ? 0 : 1;
})->purpose('Mostra banco, armazenamento, scheduler, fila, backup, tamanho e espaço livre');

// Batimento do scheduler, conferido pela prontidão (scheduler parado vira alerta).
Schedule::call(fn () => Cache::put(Prontidao::BATIMENTO_SCHEDULER, now()->toIso8601String(), now()->addHour()))
    ->everyMinute()->name('operacao:batimento')->withoutOverlapping();

// De hora em hora (idempotente): um scheduler que volta depois de parado completa a janela na hora seguinte.
Schedule::command('agenda:gerar')->hourly()->withoutOverlapping();
Schedule::command('avisos:consultas')->everyMinute()->withoutOverlapping();
Schedule::command('mensalidades:gerar')->dailyAt('01:05')->withoutOverlapping();
Schedule::command('despesas:gerar')->dailyAt('01:20')->withoutOverlapping();
Schedule::command('avisos:vencimentos')->dailyAt('07:00');
