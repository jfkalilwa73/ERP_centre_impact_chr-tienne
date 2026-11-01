<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::unprepared('
            ALTER TABLE famille_impact
                ADD COLUMN IF NOT EXISTS responsable_id UUID REFERENCES personne(id_personne) ON DELETE SET NULL,
                ADD COLUMN IF NOT EXISTS adjoint_id UUID REFERENCES personne(id_personne) ON DELETE SET NULL,
                ADD COLUMN IF NOT EXISTS capacite_max INTEGER,
                ADD COLUMN IF NOT EXISTS jour_reunion VARCHAR(20),
                ADD COLUMN IF NOT EXISTS heure_reunion TIME,
                ADD COLUMN IF NOT EXISTS lieu_reunion TEXT;

            CREATE INDEX IF NOT EXISTS idx_famille_impact_responsable ON famille_impact(responsable_id);
            CREATE INDEX IF NOT EXISTS idx_famille_impact_adjoint ON famille_impact(adjoint_id);
        ');
    }

    public function down(): void
    {
        DB::unprepared('
            ALTER TABLE famille_impact
                DROP COLUMN IF EXISTS responsable_id,
                DROP COLUMN IF EXISTS adjoint_id,
                DROP COLUMN IF EXISTS capacite_max,
                DROP COLUMN IF EXISTS jour_reunion,
                DROP COLUMN IF EXISTS heure_reunion,
                DROP COLUMN IF EXISTS lieu_reunion;
        ');
    }
};
