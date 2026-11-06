<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Versão numérica para detectar edição clínica sobre dados antigos (controle otimista)
 * e registro de quem fez cada ação relevante, sem conteúdo clínico.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (['prontuarios', 'anamneses'] as $tabela) {
            Schema::table($tabela, fn (Blueprint $table) => $table->integer('versao')->nullable());
            DB::table($tabela)->update(['versao' => 1]);
            Schema::table($tabela, fn (Blueprint $table) => $table->integer('versao')->nullable(false)->change());
        }

        Schema::create('registros_acao', function (Blueprint $table) {
            $table->id();
            $table->foreignId('psicologo_id')->constrained('psicologos')->restrictOnDelete();
            $table->string('acao', 60);
            $table->string('alvo_tipo', 40);
            $table->unsignedBigInteger('alvo_id');
            $table->timestampTz('criado_em');
            $table->index(['alvo_tipo', 'alvo_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registros_acao');
        foreach (['prontuarios', 'anamneses'] as $tabela) {
            Schema::table($tabela, fn (Blueprint $table) => $table->dropColumn('versao'));
        }
    }
};
