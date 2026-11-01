<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        DB::unprepared('
            -- Table principale du groupe transversal Familles des Disciples
            CREATE TABLE famille_disciple (
                id_famille_disciple UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                nom VARCHAR(100) NOT NULL,
                periode_debut DATE NOT NULL,
                periode_fin DATE,
                responsable_id UUID REFERENCES personne(id_personne) ON DELETE SET NULL,
                statut VARCHAR(20) DEFAULT \'actif\' CHECK (statut IN (\'actif\', \'termine\', \'archive\')),
                date_creation TIMESTAMPTZ DEFAULT NOW()
            );

            -- Table de liaison avec traçabilité du département d\'origine
            CREATE TABLE composition_famille_disciple (
                id_composition UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                id_famille_disciple UUID NOT NULL REFERENCES famille_disciple(id_famille_disciple) ON DELETE CASCADE,
                id_membre UUID NOT NULL REFERENCES membre(id_membre) ON DELETE CASCADE,
                departement_origine_id UUID NOT NULL REFERENCES departement(id_departement) ON DELETE RESTRICT,
                date_debut TIMESTAMPTZ DEFAULT NOW(),
                date_fin TIMESTAMPTZ,
                actif BOOLEAN DEFAULT TRUE,
                UNIQUE (id_famille_disciple, id_membre)
            );

            CREATE INDEX idx_famille_disciple_statut ON famille_disciple(statut);
            CREATE INDEX idx_composition_famille ON composition_famille_disciple(id_famille_disciple);
            CREATE INDEX idx_composition_departement ON composition_famille_disciple(departement_origine_id);

            -- VUE DE CONTRÔLE : Vérifie si une famille disciple a au moins 1 membre par département actif
            CREATE OR REPLACE VIEW vue_completude_famille_disciple AS
            SELECT 
                fd.id_famille_disciple,
                fd.nom,
                COUNT(DISTINCT cfd.departement_origine_id) as nb_departements_représentes,
                (SELECT COUNT(*) FROM departement WHERE actif = TRUE) as nb_departements_actifs_total,
                CASE 
                    WHEN COUNT(DISTINCT cfd.departement_origine_id) >= (SELECT COUNT(*) FROM departement WHERE actif = TRUE) 
                    THEN \'COMPLET\' 
                    ELSE \'INCOMPLET\' 
                END as statut_completude
            FROM famille_disciple fd
            LEFT JOIN composition_famille_disciple cfd ON fd.id_famille_disciple = cfd.id_famille_disciple AND cfd.actif = TRUE
            WHERE fd.statut = \'actif\'
            GROUP BY fd.id_famille_disciple, fd.nom;
        ');
    }

    public function down(): void {
        DB::unprepared('DROP VIEW IF EXISTS vue_completude_famille_disciple;');
        DB::unprepared('DROP TABLE IF EXISTS composition_famille_disciple;');
        DB::unprepared('DROP TABLE IF EXISTS famille_disciple;');
    }
};
