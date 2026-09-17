<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::unprepared('
            CREATE TABLE site (
                id_site UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code VARCHAR(20) UNIQUE NOT NULL,
                nom VARCHAR(100) NOT NULL,
                adresse TEXT,
                ville VARCHAR(100),
                pays VARCHAR(100),
                telephone VARCHAR(20),
                actif BOOLEAN DEFAULT TRUE,
                date_creation TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE departement (
                id_departement UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code VARCHAR(20) UNIQUE NOT NULL,
                nom VARCHAR(100) NOT NULL,
                mission TEXT,
                id_site UUID NOT NULL REFERENCES site(id_site) ON DELETE RESTRICT,
                actif BOOLEAN DEFAULT TRUE,
                date_creation TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE (code, id_site)
            );

            CREATE TABLE affecter_departement (
                id_personne UUID NOT NULL REFERENCES personne(id_personne) ON DELETE RESTRICT,
                id_departement UUID NOT NULL REFERENCES departement(id_departement) ON DELETE RESTRICT,
                fonction VARCHAR(100),
                date_debut TIMESTAMPTZ DEFAULT NOW(),
                date_fin TIMESTAMPTZ,
                actif BOOLEAN DEFAULT TRUE,
                PRIMARY KEY (id_personne, id_departement, date_debut)
            );

            CREATE INDEX idx_departement_site ON departement(id_site);
            CREATE INDEX idx_affecter_dept_personne ON affecter_departement(id_personne);
            CREATE INDEX idx_affecter_dept_departement ON affecter_departement(id_departement);
        ');
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS affecter_departement;');
        DB::unprepared('DROP TABLE IF EXISTS departement;');
        DB::unprepared('DROP TABLE IF EXISTS site;');
    }
};