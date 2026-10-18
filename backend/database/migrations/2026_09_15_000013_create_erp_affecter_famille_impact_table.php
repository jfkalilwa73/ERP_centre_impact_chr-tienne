<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::unprepared('
            CREATE TABLE affecter_famille_impact (
                id_affectation UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                id_membre UUID NOT NULL REFERENCES membre(id_membre) ON DELETE RESTRICT,
                id_famille_impact UUID NOT NULL REFERENCES famille_impact(id_famille) ON DELETE RESTRICT,
                date_debut TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                date_fin TIMESTAMPTZ,
                actif BOOLEAN NOT NULL DEFAULT TRUE,
                motif_fin TEXT
            );

            CREATE INDEX idx_affectation_membre ON affecter_famille_impact(id_membre);
            CREATE INDEX idx_affectation_famille_impact ON affecter_famille_impact(id_famille_impact);
            CREATE UNIQUE INDEX uq_affectation_membre_active
                ON affecter_famille_impact(id_membre) WHERE actif = TRUE;
        ');
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS affecter_famille_impact;');
    }
};
