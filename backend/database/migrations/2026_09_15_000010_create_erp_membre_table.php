<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::unprepared('
            CREATE TABLE membre (
                id_membre UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                id_personne UUID NOT NULL REFERENCES personne(id_personne) ON DELETE RESTRICT UNIQUE,
                numero_membre VARCHAR(20) UNIQUE NOT NULL,
                date_integration DATE NOT NULL,
                statut_membre VARCHAR(20) NOT NULL DEFAULT \'en_attente\' CHECK (statut_membre IN (\'actif\', \'inactif\', \'en_attente\', \'archive\')),
                date_changement_statut TIMESTAMPTZ,
                motif_changement_statut TEXT,
                famille_impact_id UUID REFERENCES famille_impact(id_famille) ON DELETE SET NULL,
                date_creation TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                date_modification TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE INDEX idx_membre_personne ON membre(id_personne);
            CREATE INDEX idx_membre_numero ON membre(numero_membre);
            CREATE INDEX idx_membre_statut ON membre(statut_membre);
            CREATE INDEX idx_membre_famille_impact ON membre(famille_impact_id);

            -- Trigger 1 : génération automatique du numéro membre (MEM-YYYY-0001)
            CREATE OR REPLACE FUNCTION generer_numero_membre()
            RETURNS TRIGGER AS $$
            DECLARE
                annee INTEGER := EXTRACT(YEAR FROM NOW())::INTEGER;
                compte INTEGER;
                prefixe VARCHAR := \'MEM-\' || annee || \'-\';
                numero VARCHAR(20);
            BEGIN
                IF NEW.numero_membre IS NULL OR NEW.numero_membre = \'\' THEN
                    SELECT COUNT(*) INTO compte FROM membre;
                    numero := prefixe || LPAD((compte + 1)::TEXT, 4, \'0\');
                    NEW.numero_membre := numero;
                END IF;
                IF NEW.date_changement_statut IS NULL THEN
                    NEW.date_changement_statut := NOW();
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER trg_numero_membre_auto
            BEFORE INSERT ON membre
            FOR EACH ROW EXECUTE FUNCTION generer_numero_membre();

            -- Trigger 2 : historisation automatique du changement de statut membre
            CREATE OR REPLACE FUNCTION enregistrer_historique_statut_membre()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.statut_membre IS DISTINCT FROM NEW.statut_membre THEN
                    INSERT INTO historique_statut_membre (id_historique, id_membre, ancien_statut, nouveau_statut, motif, change_par, date_changement)
                    VALUES (gen_random_uuid(), NEW.id_membre, OLD.statut_membre, NEW.statut_membre, NEW.motif_changement_statut, NULL, NOW());
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER trg_historique_statut_membre
            AFTER UPDATE ON membre
            FOR EACH ROW EXECUTE FUNCTION enregistrer_historique_statut_membre();

            -- Trigger 3 : empêcher la suppression d\'un membre actif (soft-delete obligatoire)
            CREATE OR REPLACE FUNCTION prevent_active_membre_delete()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.statut_membre = \'actif\' THEN
                    RAISE EXCEPTION \'Impossible de supprimer un membre actif. Passer le statut à inactif ou archive d\'\'abord.\';
                END IF;
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER trg_prevent_active_membre_delete
            BEFORE DELETE ON membre
            FOR EACH ROW EXECUTE FUNCTION prevent_active_membre_delete();

            -- Trigger 4 : mise à jour automatique de date_modification
            CREATE TRIGGER trg_membre_modification
            BEFORE UPDATE ON membre
            FOR EACH ROW EXECUTE FUNCTION update_date_modification();
        ');
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS trg_prevent_active_membre_delete ON membre;');
        DB::unprepared('DROP FUNCTION IF EXISTS prevent_active_membre_delete();');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_historique_statut_membre ON membre;');
        DB::unprepared('DROP FUNCTION IF EXISTS enregistrer_historique_statut_membre();');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_numero_membre_auto ON membre;');
        DB::unprepared('DROP FUNCTION IF EXISTS generer_numero_membre();');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_membre_modification ON membre;');
        DB::unprepared('DROP TABLE IF EXISTS membre;');
    }
};
