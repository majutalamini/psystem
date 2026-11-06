<?php

use App\Actions\CriarCobranca;
use App\Actions\CriarConsulta;
use App\Actions\CriarMatricula;
use App\Actions\CriarPaciente;
use App\Services\Mensalidades;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (! $app->environment('local', 'testing') || DB::getDriverName() !== 'pgsql'
    || DB::connection()->getDatabaseName() !== 'psystem_e2e' || config('database.connections.pgsql.url')) {
    throw new RuntimeException('Os dados de navegador exigem o banco PostgreSQL isolado psystem_e2e, sem DB_URL.');
}

DB::transaction(function () {
    $paciente = CriarPaciente::executar([
        'nome' => 'Paciente E2E',
        'status_paciente' => 'ativo',
        'cpf' => '52998224725',
        'telefone' => '(48) 99999-0000',
        'data_nascimento' => '1990-01-01',
    ]);
    $matricula = CriarMatricula::executar([
        'paciente_id' => $paciente->id,
        'inicio_da_matricula' => today()->subWeeks(4),
        'dia_da_matricula' => 'segunda-feira',
        'horario_da_matricula' => '08:00',
        'tipo_da_consulta' => 'presencial',
        'valor_sessao' => 200,
    ]);
    app(Mensalidades::class)->gerar($matricula);
    $historica = CriarConsulta::executar([
        'paciente_id' => $paciente->id,
        'data_hora_consulta' => today()->subWeek()->startOfWeek()->setTime(8, 0),
        'modalidade' => 'presencial',
        'status' => 'realizado',
    ]);
    CriarCobranca::executar([
        'paciente_id' => $paciente->id,
        'agenda_id' => $historica->id,
        'titulo' => 'Consulta sintética E2E',
        'valor' => 150,
        'vencimento' => today(),
    ]);
});
