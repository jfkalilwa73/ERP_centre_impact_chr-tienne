<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Appel du seeder de test de la Phase 0
        $this->call([
            Phase0ScenarioSeeder::class,
        ]);
    }
}