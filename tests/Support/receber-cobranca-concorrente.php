<?php

use App\Actions\ReceberCobranca;
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
    ReceberCobranca::executar((int) $argv[1], ['valor' => (float) $argv[2], 'metodo_pagamento' => 'pix', 'data_pagamento' => '2026-09-28']);
    echo json_encode(['status' => 'created'], JSON_THROW_ON_ERROR).PHP_EOL;
} catch (ValidationException $exception) {
    echo json_encode(['status' => 'rejected', 'fields' => array_keys($exception->errors())], JSON_THROW_ON_ERROR).PHP_EOL;
}
