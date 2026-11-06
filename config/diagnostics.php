<?php

return [
    // Somente laboratório local/testing; nunca habilita instrumentação em produção.
    'enabled' => env('DIAGNOSTICS_ENABLED', false),
];
