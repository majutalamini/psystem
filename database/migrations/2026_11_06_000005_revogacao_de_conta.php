<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Etapa 3: conta revogada perde o acesso (sessões, "manter conectado", login e recuperação de senha). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('psicologos', function (Blueprint $table) {
            $table->timestampTz('revogada_em')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('psicologos', function (Blueprint $table) {
            $table->dropColumn('revogada_em');
        });
    }
};
