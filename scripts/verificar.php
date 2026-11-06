<?php

// Verificação local agregada: todos os passos são executados, e qualquer falha reprova o conjunto.
if (PHP_OS_FAMILY !== 'Linux' || ! is_file('/.dockerenv')) {
    fwrite(STDERR, "Execute dentro do Docker: docker compose --profile tools run --rm -T verificar composer verificar\n");
    exit(1);
}

chdir(dirname(__DIR__));
// Composer limpa variáveis GIT_* herdadas de hooks. Restaure somente os caminhos
// explícitos do wrapper local, já montados no container; nunca reescreva .git.
if (getenv('PSYSTEM_GIT_DIR') !== false) {
    $gitDirectory = realpath(getenv('PSYSTEM_GIT_DIR'));
    $commonDirectory = realpath(getenv('PSYSTEM_GIT_COMMON_DIR') ?: '');
    if ($gitDirectory === false || $commonDirectory !== '/git-common'
        || ($gitDirectory !== $commonDirectory && ! str_starts_with($gitDirectory, $commonDirectory.'/worktrees/'))) {
        throw new RuntimeException('Metadados Git locais inválidos.');
    }
    putenv('GIT_DIR='.$gitDirectory);
    putenv('GIT_COMMON_DIR='.$commonDirectory);
    putenv('GIT_WORK_TREE='.getcwd());
    putenv('GIT_OPTIONAL_LOCKS=0');
}
$started = new DateTimeImmutable('now', new DateTimeZone('America/Sao_Paulo'));
$directory = 'artifacts/diagnostico';
if (! is_dir($directory) && ! mkdir($directory, 0777, true) && ! is_dir($directory)) {
    throw new RuntimeException('Não foi possível criar o diretório de evidências.');
}
$prefix = $directory.'/verificar-'.$started->format('Y-m-d_H-i-s-u');
$log = fopen($prefix.'.log', 'x');
if ($log === false) {
    throw new RuntimeException('Não foi possível abrir o log da verificação.');
}
$emit = static function (string $text) use ($log): void {
    fwrite(STDOUT, $text);
    if (fwrite($log, $text) === false) {
        throw new RuntimeException('Falha ao gravar a evidência da verificação.');
    }
};
$run = static function (array $command, bool $stream = true) use ($emit): array {
    $pipes = [];
    // Argumentos estruturados, sem interpolação de shell. Une stderr/stdout no mesmo stream.
    $process = proc_open($command, [0 => ['file', '/dev/null', 'r'], 1 => ['pipe', 'w'], 2 => ['redirect', 1]], $pipes);
    if (! is_resource($process)) {
        return ['code' => 127, 'output' => 'Não foi possível iniciar o comando.'];
    }
    $output = '';
    while (! feof($pipes[1])) {
        $chunk = fread($pipes[1], 8192);
        if ($chunk === false) {
            throw new RuntimeException('Falha na leitura da saída do comando.');
        }
        $output .= $chunk;
        if ($stream) {
            $emit($chunk);
        }
    }
    fclose($pipes[1]);

    return ['code' => proc_close($process), 'output' => $output];
};
$git = ['git', '-c', 'safe.directory='.getcwd()];
$head = $run([...$git, 'rev-parse', 'HEAD'], false);
if ($head['code'] !== 0) {
    $emit("Não foi possível identificar o commit; verificação reprovada.\n".$head['output']);
    fclose($log);
    exit(1);
}
$commit = trim($head['output']);
$status = $run([...$git, 'status', '--porcelain'], false);
$diff = $run([...$git, 'diff', 'HEAD'], false);
$emit("Verificação local Psystem\nData: ".$started->format(DateTimeInterface::ATOM)."\nCommit: {$commit}\nAlterações locais: ".(trim($status['output']) === '' ? 'não' : 'sim')."\n");
$emit('PHP: '.PHP_VERSION."\n");
$run(['node', '--version']);
$run(['npm', '--version']);

$steps = [
    'pint' => [PHP_BINARY, 'vendor/bin/pint', '--test'],
    'testes' => [PHP_BINARY, 'artisan', 'test', '--no-ansi'],
    'schema' => [PHP_BINARY, 'scripts/verificar-schema.php'],
    'build' => ['npm', 'run', 'build'],
    'audit' => ['npm', 'audit'],
    'composer-audit' => ['composer', 'audit', '--locked', '--no-interaction'],
];
$results = [];
$failed = $status['code'] !== 0 || $diff['code'] !== 0;
foreach ($steps as $name => $command) {
    $emit("\n=== {$name}: ".implode(' ', $command)." ===\n");
    $start = microtime(true);
    $result = $run($command);
    $results[$name] = ['exitCode' => $result['code'], 'durationSeconds' => round(microtime(true) - $start, 3)];
    $failed = $failed || $result['code'] !== 0;
    $emit("\nResultado {$name}: código {$result['code']}\n");
}
$exitCode = $failed ? 1 : 0;
$finished = new DateTimeImmutable('now', new DateTimeZone('America/Sao_Paulo'));
$emit("\nResultado final: ".($failed ? 'REPROVADO' : 'APROVADO')." (código {$exitCode})\nFim: ".$finished->format(DateTimeInterface::ATOM)."\n");
fclose($log);
$evidence = [
    'startedAt' => $started->format(DateTimeInterface::ATOM),
    'finishedAt' => $finished->format(DateTimeInterface::ATOM),
    'commit' => $commit,
    'dirty' => trim($status['output']) !== '',
    'trackedDiffSha256' => hash('sha256', $diff['output']),
    'command' => 'docker compose --profile tools run --rm -T verificar composer verificar',
    'steps' => $results,
    'result' => $failed ? 'reprovado' : 'aprovado',
    'exitCode' => $exitCode,
    'log' => basename($prefix.'.log'),
];
if (file_put_contents($prefix.'.json', json_encode($evidence, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR).PHP_EOL) === false) {
    fwrite(STDERR, "Falha ao gravar o resultado JSON.\n");
    exit(1);
}
exit($exitCode);
