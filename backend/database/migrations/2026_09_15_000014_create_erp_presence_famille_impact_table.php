<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::unprepared('
            CREATE TABLE presence_famille_impact (
                id_presence UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                id_affectation UUID NOT NULL REFERENCES affecter_famille_impact(id_affectation) ON DELETE RESTRICT,
                date_reunion DATE NOT NULL,
                present BOOLEAN NOT NULL DEFAULT FALSE,
                commentaire TEXT,
                enregistre_par UUID REFERENCES users(id) ON DELETE SET NULL
            );

            CREATE INDEX idx_presence_affectation ON presence_famille_impact(id_affectation);
            CREATE INDEX idx_presence_date ON presence_famille_impact(date_reunion);
        ');
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS presence_famille_impact;');
    }
};
