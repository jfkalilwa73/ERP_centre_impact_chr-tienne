<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        // Le processus `artisan test` charge déjà .env. On force la base de test
        // avant le bootstrap, sinon RefreshDatabase efface la base de l'application.
        foreach ([
            'APP_ENV' => 'testing',
            'DB_CONNECTION' => 'pgsql',
            'DB_HOST' => 'postgres',
            'DB_PORT' => '5432',
            'DB_DATABASE' => 'erp_eglise_test',
            'DB_USERNAME' => 'erp_user',
            'DB_PASSWORD' => 'erp_password',
        ] as $key => $value) {
            putenv($key.'='.$value);
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }

        putenv('DB_URL');
        unset($_ENV['DB_URL'], $_SERVER['DB_URL']);

        $app = parent::createApplication();

        // Un cache de config fige le nom de la base. On le corrige avant RefreshDatabase.
        $app['config']->set('database.connections.pgsql.database', 'erp_eglise_test');
        $app['db']->purge('pgsql');

        return $app;
    }
}
