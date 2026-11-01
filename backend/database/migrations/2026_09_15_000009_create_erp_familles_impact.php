<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE TABLE famille_impact (
                id_famille UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code VARCHAR(20) UNIQUE NOT NULL,
                nom VARCHAR(100) NOT NULL UNIQUE,
                zone VARCHAR(100),
                description TEXT,
                actif BOOLEAN NOT NULL DEFAULT TRUE,
                date_creation TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE appartenir_famille (
                id_personne UUID NOT NULL REFERENCES personne(id_personne) ON DELETE RESTRICT,
                id_famille UUID NOT NULL REFERENCES famille_impact(id_famille) ON DELETE RESTRICT,
                fonction VARCHAR(100),
                date_debut TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                date_fin TIMESTAMPTZ,
                actif BOOLEAN NOT NULL DEFAULT TRUE,
                PRIMARY KEY (id_personne, id_famille, date_debut)
            );

            CREATE INDEX idx_appartenir_famille_personne ON appartenir_famille(id_personne);
            CREATE INDEX idx_appartenir_famille_famille ON appartenir_famille(id_famille);
            CREATE UNIQUE INDEX uq_appartenir_famille_personne_active
                ON appartenir_famille(id_personne) WHERE actif = TRUE;
        SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS appartenir_famille; DROP TABLE IF EXISTS famille_impact;');
    }
};
