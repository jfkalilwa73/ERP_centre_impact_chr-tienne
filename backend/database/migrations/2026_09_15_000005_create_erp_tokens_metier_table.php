<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::unprepared('
            CREATE TABLE token_metier (
                id_token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
                type_token VARCHAR(50) NOT NULL CHECK (type_token IN (
                    \'refresh\', \'email_verification\', \'password_reset\', \'invitation\',
                    \'mfa\', \'api_key\', \'webhook_secret\', \'member_card\', \'checkin\', 
                    \'document_share\', \'oauth\', \'one_time\'
                )),
                hash_token VARCHAR(500) NOT NULL,
                nom VARCHAR(100),
                scope JSONB,
                metadata JSONB,
                date_expiration TIMESTAMPTZ NOT NULL,
                derniere_utilisation TIMESTAMPTZ,
                adresse_ip_derniere_utilisation INET,
                user_agent_derniere_utilisation TEXT,
                nombre_utilisations INTEGER DEFAULT 0,
                nombre_utilisations_max INTEGER,
                actif BOOLEAN DEFAULT TRUE,
                date_creation TIMESTAMPTZ DEFAULT NOW(),
                date_revocation TIMESTAMPTZ,
                motif_revocation VARCHAR(255)
            );

            CREATE INDEX idx_token_metier_user ON token_metier(user_id);
            CREATE INDEX idx_token_metier_hash ON token_metier(hash_token);
            CREATE INDEX idx_token_metier_type ON token_metier(type_token);
            CREATE INDEX idx_token_metier_expiration ON token_metier(date_expiration);
            CREATE INDEX idx_token_metier_actif ON token_metier(actif) WHERE actif = TRUE;

            CREATE OR REPLACE FUNCTION revoke_tokens_on_user_desactivation()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.statut != \'actif\' AND OLD.statut = \'actif\' THEN
                    UPDATE token_metier
                    SET actif = FALSE,
                        date_revocation = NOW(),
                        motif_revocation = \'Compte désactivé (statut: \' || NEW.statut || \')\'
                    WHERE user_id = NEW.id AND actif = TRUE;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER trg_revoke_tokens_on_desactivation
            AFTER UPDATE OF statut ON users
            FOR EACH ROW EXECUTE FUNCTION revoke_tokens_on_user_desactivation();

            CREATE OR REPLACE VIEW vue_tokens_actifs AS
            SELECT t.id_token, t.user_id, u.email, t.type_token, t.nom,
                   t.date_expiration, t.derniere_utilisation, t.adresse_ip_derniere_utilisation,
                   t.nombre_utilisations, t.date_creation
            FROM token_metier t
            JOIN users u ON t.user_id = u.id
            WHERE t.actif = TRUE AND t.date_expiration > NOW();
        ');
    }

    public function down(): void
    {
        DB::unprepared('DROP VIEW IF EXISTS vue_tokens_actifs;');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_revoke_tokens_on_desactivation ON users;');
        DB::unprepared('DROP FUNCTION IF EXISTS revoke_tokens_on_user_desactivation();');
        DB::unprepared('DROP TABLE IF EXISTS token_metier;');
    }
};