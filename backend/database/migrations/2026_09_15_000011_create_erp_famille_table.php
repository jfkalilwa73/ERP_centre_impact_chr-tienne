<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::unprepared('
            CREATE TABLE famille (
                id_famille UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                nom_famille VARCHAR(150) NOT NULL,
                adresse TEXT,
                telephone_principal VARCHAR(20),
                responsable_legal_id UUID REFERENCES personne(id_personne) ON DELETE SET NULL,
                date_creation TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE INDEX idx_famille_responsable ON famille(responsable_legal_id);
            CREATE INDEX idx_famille_nom ON famille(nom_famille);
        ');
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS famille;');
    }
};
