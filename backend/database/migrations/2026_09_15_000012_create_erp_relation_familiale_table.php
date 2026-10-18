<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::unprepared('
            CREATE TABLE relation_familiale (
                id_relation UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                id_famille UUID NOT NULL REFERENCES famille(id_famille) ON DELETE RESTRICT,
                id_personne_1 UUID NOT NULL REFERENCES personne(id_personne) ON DELETE RESTRICT,
                id_personne_2 UUID NOT NULL REFERENCES personne(id_personne) ON DELETE RESTRICT,
                type_relation VARCHAR(20) NOT NULL CHECK (type_relation IN (\'conjoint\', \'parent\', \'enfant\', \'tuteur\', \'frere_soeur\', \'autre\')),
                date_debut TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                date_fin TIMESTAMPTZ,
                actif BOOLEAN NOT NULL DEFAULT TRUE
            );

            CREATE INDEX idx_relation_familiale ON relation_familiale(id_famille);
            CREATE INDEX idx_relation_personne_1 ON relation_familiale(id_personne_1);
            CREATE INDEX idx_relation_personne_2 ON relation_familiale(id_personne_2);
        ');
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS relation_familiale;');
    }
};
