<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::unprepared('
            CREATE TABLE audit_log (
                id_audit UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(50) NOT NULL,
                entite_type VARCHAR(50) NOT NULL,
                id_entite UUID NOT NULL,
                anciennes_valeurs JSONB,
                nouvelles_valeurs JSONB,
                adresse_ip INET,
                user_agent TEXT,
                date_action TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX idx_audit_user ON audit_log(user_id);
            CREATE INDEX idx_audit_entite ON audit_log(entite_type, id_entite);
            CREATE INDEX idx_audit_date ON audit_log(date_action DESC);
        ');
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS audit_log;');
    }
};