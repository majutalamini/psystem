<?php

use Illuminate\Foundation\Console\ServeCommand;
use Symfony\Component\Console\Input\ArgvInput;

// O `artisan serve` com reload remove variáveis do Compose ao iniciar o processo web.
// Preserva só o isolamento do laboratório, sem mudar o número efetivo de workers do baseline.
define('LARAVEL_START', microtime(true));
require __DIR__.'/../../vendor/autoload.php';

ServeCommand::$passthroughVariables = array_merge(
    ServeCommand::$passthroughVariables,
    ['APP_DEBUG', 'APP_URL', 'APP_KEY', 'DB_CONNECTION', 'DB_URL', 'DB_DATABASE',
        'DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD',
        'DIAGNOSTICS_ENABLED', 'MAIL_MAILER', 'SESSION_COOKIE'],
);

$app = require __DIR__.'/../../bootstrap/app.php';
exit($app->handleCommand(new ArgvInput));
