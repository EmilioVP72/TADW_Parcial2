<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pending_transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('persona_id')->nullable();
            $table->uuid('institucion_id')->nullable();
            $table->uuid('programa_id')->nullable();
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->string('titulo_obtenido', 255)->nullable();
            $table->string('numero_cedula', 50)->nullable();
            $table->text('titulo_tesis')->nullable();
            $table->string('menciones', 100)->nullable();
            $table->string('firmado_por', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pending_transactions');
    }
};
