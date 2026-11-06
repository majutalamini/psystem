<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('importacoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paciente_id')->index()->constrained('pacientes')->cascadeOnDelete();
            $table->string('tipo', 20); // prontuario | anamnese
            $table->string('arquivo', 255);
            $table->boolean('anexado');
            $table->timestampTz('criado_em');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('importacoes');
    }
};
