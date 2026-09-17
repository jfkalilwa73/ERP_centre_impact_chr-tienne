<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Note : Utilisation de guillemets simples ' pour éviter que PHP n'interprète les $$
        DB::unprepared('
            CREATE OR REPLACE FUNCTION update_date_modification()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.date_modification = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        ');
    }

    public function down(): void
    {
        DB::unprepared('DROP FUNCTION IF EXISTS update_date_modification();');
    }
};