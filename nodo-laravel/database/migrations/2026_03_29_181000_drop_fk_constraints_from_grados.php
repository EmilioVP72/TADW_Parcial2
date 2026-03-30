<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Elimina las FK constraints de grados para que pueda recibir bloques de otros nodos
     * que tienen sus propias instancias de Supabase.
     */
    public function up(): void
    {
        // Eliminar constraints FK en PostgreSQL via SQL directo
        DB::statement('ALTER TABLE grados DROP CONSTRAINT IF EXISTS grados_persona_id_foreign');
        DB::statement('ALTER TABLE grados DROP CONSTRAINT IF EXISTS grados_institucion_id_foreign');
        DB::statement('ALTER TABLE grados DROP CONSTRAINT IF EXISTS grados_programa_id_foreign');

        Schema::table('grados', function (Blueprint $table) {
            // Hacer nullable las columnas que pueden venir vacías de otros nodos
            $table->uuid('persona_id')->nullable()->change();
            $table->uuid('institucion_id')->nullable()->change();
            $table->uuid('programa_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        // No restauramos FKs para no romper datos existentes
    }
};
