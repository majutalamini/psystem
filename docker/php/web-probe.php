<?php

// Instrumentação somente no listener interno do Nginx; fora do public/.
header('Content-Type: application/json');
$status = opcache_get_status(false);
echo json_encode([
    'sapi' => PHP_SAPI,
    'php' => PHP_VERSION,
    'pid' => getmypid(),
    'opcacheEnabled' => $status['opcache_enabled'] ?? false,
    'validateTimestamps' => ini_get('opcache.validate_timestamps'),
    'cacheFull' => $status['cache_full'] ?? null,
    'memory' => $status['memory_usage'] ?? null,
    'statistics' => $status['opcache_statistics'] ?? null,
    'peakMemoryBytes' => memory_get_peak_usage(true),
], JSON_THROW_ON_ERROR);
