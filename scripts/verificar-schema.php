<?php

use App\Support\VerificacaoSchema;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
try {
    if (! $app->environment('testing') || DB::getDriverName() !== 'pgsql'
        || DB::connection()->getDatabaseName() !== 'psystem_test' || config('database.connections.pgsql.url')) {
        throw new RuntimeException('A verificação exige o schema de testes PostgreSQL isolado psystem_test.');
    }
    DB::statement('SET default_transaction_read_only = on');
    $result = ($argv[1] ?? '') === '--catalogo' ? VerificacaoSchema::catalogo() : VerificacaoSchema::verificar();
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR).PHP_EOL;
} catch (Throwable $exception) {
    fwrite(STDERR, 'Schema REPROVADO: '.$exception->getMessage().PHP_EOL);
    exit(1);
}
