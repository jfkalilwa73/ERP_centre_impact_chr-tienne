<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE personne ADD COLUMN IF NOT EXISTS postnom VARCHAR(100);
            ALTER TABLE famille_impact DROP COLUMN IF EXISTS zone;
        SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE personne DROP COLUMN IF EXISTS postnom;
            ALTER TABLE famille_impact ADD COLUMN IF NOT EXISTS zone VARCHAR(100);
        SQL);
    }
};
