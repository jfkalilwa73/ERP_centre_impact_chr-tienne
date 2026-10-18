<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::unprepared('
            CREATE TABLE historique_statut_membre (
                id_historique UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                id_membre UUID NOT NULL REFERENCES membre(id_membre) ON DELETE RESTRICT,
                ancien_statut VARCHAR(20),
                nouveau_statut VARCHAR(20) NOT NULL CHECK (nouveau_statut IN (\'actif\', \'inactif\', \'en_attente\', \'archive\')),
                motif TEXT,
                change_par UUID REFERENCES users(id) ON DELETE SET NULL,
                date_changement TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE INDEX idx_historique_membre ON historique_statut_membre(id_membre);
            CREATE INDEX idx_historique_date ON historique_statut_membre(date_changement);
        ');
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS historique_statut_membre;');
    }
};
