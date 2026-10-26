<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('configuracoes', function (Blueprint $table) {
            $table->integer('intervalo_sessao')->default(0);
            $table->time('almoco_inicio')->nullable();
            $table->time('almoco_fim')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('configuracoes', function (Blueprint $table) {
            $table->dropColumn(['intervalo_sessao', 'almoco_inicio', 'almoco_fim']);
        });
    }
};
