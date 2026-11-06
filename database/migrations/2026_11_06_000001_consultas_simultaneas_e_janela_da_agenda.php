<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Limite opcional de consultas por horário (nulo = sem limite) e última geração da janela de 14 dias. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('configuracoes', function (Blueprint $table) {
            $table->integer('consultas_simultaneas')->nullable();
            $table->timestampTz('agenda_gerada_em')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('configuracoes', function (Blueprint $table) {
            $table->dropColumn(['consultas_simultaneas', 'agenda_gerada_em']);
        });
    }
};
