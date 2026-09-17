<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::unprepared('
            CREATE TABLE role_metier (
                id_role UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code VARCHAR(50) UNIQUE NOT NULL,
                nom VARCHAR(100) NOT NULL,
                description TEXT,
                niveau_confidentialite INTEGER DEFAULT 1,
                actif BOOLEAN DEFAULT TRUE,
                date_creation TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE permission_metier (
                id_permission UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code VARCHAR(100) UNIQUE NOT NULL,
                module VARCHAR(50) NOT NULL,
                action VARCHAR(50) NOT NULL,
                description TEXT,
                actif BOOLEAN DEFAULT TRUE,
                UNIQUE (module, action)
            );

            CREATE TABLE affecter_role_metier (
                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
                id_role UUID NOT NULL REFERENCES role_metier(id_role),
                date_debut TIMESTAMPTZ DEFAULT NOW(),
                date_fin TIMESTAMPTZ,
                actif BOOLEAN DEFAULT TRUE,
                PRIMARY KEY (user_id, id_role, date_debut)
            );

            CREATE TABLE attribuer_permission (
                id_role UUID NOT NULL REFERENCES role_metier(id_role),
                id_permission UUID NOT NULL REFERENCES permission_metier(id_permission),
                PRIMARY KEY (id_role, id_permission)
            );

            CREATE INDEX idx_role_metier_code ON role_metier(code);
            CREATE INDEX idx_permission_metier_module ON permission_metier(module, action);
            CREATE INDEX idx_affecter_role_user ON affecter_role_metier(user_id);
        ');
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS attribuer_permission;');
        DB::unprepared('DROP TABLE IF EXISTS affecter_role_metier;');
        DB::unprepared('DROP TABLE IF EXISTS permission_metier;');
        DB::unprepared('DROP TABLE IF EXISTS role_metier;');
    }
};