<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE TABLE pilotage_document (
                cle VARCHAR(40) PRIMARY KEY,
                contenu JSONB NOT NULL,
                date_modification TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS pilotage_document;');
    }
};
