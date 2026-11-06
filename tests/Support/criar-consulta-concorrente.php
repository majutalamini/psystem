<?php

use App\Actions\CriarConsulta;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! $app->environment('testing') || DB::getDriverName() !== 'pgsql' || DB::connection()->getDatabaseName() !== 'psystem_test') {
    throw new RuntimeException('Escritor concorrente exclusivo de psystem_test.');
}
DB::selectOne('SELECT set_config(?, ?, false)', ['application_name', $argv[3]]);
try {
    $consulta = CriarConsulta::executar([
        'paciente_id' => (int) $argv[1], 'data_hora_consulta' => $argv[2], 'modalidade' => 'online',
    ]);
    echo json_encode(['status' => 'created', 'id' => $consulta->id], JSON_THROW_ON_ERROR).PHP_EOL;
} catch (ValidationException $exception) {
    echo json_encode(['status' => 'rejected', 'fields' => array_keys($exception->errors())], JSON_THROW_ON_ERROR).PHP_EOL;
}
