<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * O histórico clínico não sai junto com o paciente por nenhum caminho: as FKs de paciente
 * que apagavam em cascata passam a recusar. Uma consulta gera no máximo uma cobrança.
 */
return new class extends Migration
{
    private const TABELAS = ['documentos', 'anamneses', 'anamnese_respostas'];

    public function up(): void
    {
        foreach (self::TABELAS as $tabela) {
            Schema::table($tabela, function (Blueprint $table) {
                $table->dropForeign(['paciente_id']);
                $table->foreign('paciente_id')->references('id')->on('pacientes')->restrictOnDelete();
            });
        }

        DB::statement('CREATE UNIQUE INDEX cobrancas_agenda_unica ON cobrancas (agenda_id) WHERE agenda_id IS NOT NULL');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX cobrancas_agenda_unica');

        foreach (self::TABELAS as $tabela) {
            Schema::table($tabela, function (Blueprint $table) {
                $table->dropForeign(['paciente_id']);
                $table->foreign('paciente_id')->references('id')->on('pacientes')->cascadeOnDelete();
            });
        }
    }
};
