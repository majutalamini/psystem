<?php

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $app = parent::createApplication();

        // Antes de RefreshDatabase: nunca migrar/apagar o banco usado pelo consultório.
        if (! $app->environment('testing')
            || config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'psystem_test'
            || config('database.connections.pgsql.url')) {
            throw new RuntimeException('Os testes exigem PostgreSQL no banco isolado psystem_test, sem DB_URL e sem configuração em cache.');
        }

        return $app;
    }
}
