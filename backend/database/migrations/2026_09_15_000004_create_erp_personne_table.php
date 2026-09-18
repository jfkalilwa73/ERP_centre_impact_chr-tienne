<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::unprepared('
            CREATE TABLE personne (
                id_personne UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
                nom VARCHAR(100) NOT NULL,
                prenom VARCHAR(100) NOT NULL,
                date_naissance DATE,
                sexe CHAR(1) CHECK (sexe IN (\'M\', \'F\')),
                telephone VARCHAR(20),
                adresse TEXT,
                photo_url VARCHAR(500),
                statut VARCHAR(20) DEFAULT \'actif\' CHECK (statut IN (\'actif\', \'inactif\', \'archive\')),
                date_creation TIMESTAMPTZ DEFAULT NOW(),
                date_modification TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX idx_personne_user ON personne(user_id);
            CREATE INDEX idx_personne_nom ON personne(nom, prenom);
            CREATE INDEX idx_personne_statut ON personne(statut);

            -- Trigger 1 : Mise à jour automatique de la date
            CREATE TRIGGER trg_personne_modification
            BEFORE UPDATE ON personne
            FOR EACH ROW EXECUTE FUNCTION update_date_modification();

            -- Trigger 2 : EMPÊCHER la suppression d\'une personne active (AJOUT MANQUANT)
            CREATE OR REPLACE FUNCTION prevent_active_personne_delete()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.statut = \'actif\' THEN
                    RAISE EXCEPTION \'Impossible de supprimer une personne active. Passer le statut à inactif ou archive d\'\'abord.\';
                END IF;
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER trg_prevent_active_personne_delete
            BEFORE DELETE ON personne
            FOR EACH ROW EXECUTE FUNCTION prevent_active_personne_delete();
        ');
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS trg_prevent_active_personne_delete ON personne;');
        DB::unprepared('DROP FUNCTION IF EXISTS prevent_active_personne_delete();');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_personne_modification ON personne;');
        DB::unprepared('DROP TABLE IF EXISTS personne;');
    }
};