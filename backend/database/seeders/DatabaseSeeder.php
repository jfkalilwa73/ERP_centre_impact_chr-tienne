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
        $this->call([
            Phase0ScenarioSeeder::class,
        ]);

        // Appel du seeder de test du Sprint 1 — Membres & Familles
        $this->call([
            Sprint1MembresFamillesSeeder::class,
        ]);
    }
}