<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE famille_impact
                ADD COLUMN latitude DOUBLE PRECISION,
                ADD COLUMN longitude DOUBLE PRECISION;
        SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE famille_impact
                DROP COLUMN IF EXISTS latitude,
                DROP COLUMN IF EXISTS longitude;
        SQL);
    }
};
