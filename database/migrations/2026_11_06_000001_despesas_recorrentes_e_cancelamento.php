<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Modelo da conta a pagar que se repete todo mês no mesmo dia.
        Schema::create('despesas_recorrentes', function (Blueprint $table) {
            $table->id();
            $table->string('descricao', 200);
            $table->string('categoria', 40);
            $table->decimal('valor', 10, 2);
            $table->unsignedTinyInteger('dia');
            $table->date('inicio'); // primeiro dia do mês da primeira conta
            $table->boolean('ativa')->default(true);
            $table->timestampTz('criado_em')->useCurrent();
        });

        Schema::table('despesas', function (Blueprint $table) {
            $table->foreignId('recorrente_id')->nullable()->constrained('despesas_recorrentes')->nullOnDelete();
            $table->date('competencia')->nullable();
            $table->date('cancelada_em')->nullable();
            $table->unique(['recorrente_id', 'competencia']);
        });
    }

    public function down(): void
    {
        Schema::table('despesas', function (Blueprint $table) {
            $table->dropUnique(['recorrente_id', 'competencia']);
            $table->dropConstrainedForeignId('recorrente_id');
            $table->dropColumn(['competencia', 'cancelada_em']);
        });
        Schema::dropIfExists('despesas_recorrentes');
    }
};
