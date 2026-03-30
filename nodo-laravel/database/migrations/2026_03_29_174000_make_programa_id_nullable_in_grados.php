<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Hace nullable las columnas requeridas que pueden llegar vacías de otros nodos.
     */
    public function up(): void
    {
        // Eliminar la FK constraint de programa_id para poder hacerla nullable
        Schema::table('grados', function (Blueprint $table) {
            $table->uuid('programa_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('grados', function (Blueprint $table) {
            $table->uuid('programa_id')->nullable(false)->change();
        });
    }
};
