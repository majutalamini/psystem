<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Dia do mês em que vence a mensalidade lançada pela matrícula.
        Schema::table('pacientes', function (Blueprint $table) {
            $table->unsignedTinyInteger('dia_vencimento')->default(10);
        });

        // Mensalidade de matrícula: uma por matrícula e mês (competência = primeiro dia do mês).
        Schema::table('cobrancas', function (Blueprint $table) {
            $table->foreignId('matricula_id')->nullable()->constrained('matriculas')->nullOnDelete();
            $table->date('competencia')->nullable();
            $table->unique(['matricula_id', 'competencia']);
        });

        // Valor de uma consulta avulsa.
        Schema::table('agenda', function (Blueprint $table) {
            $table->decimal('valor', 10, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('agenda', fn (Blueprint $t) => $t->dropColumn('valor'));
        Schema::table('cobrancas', function (Blueprint $table) {
            $table->dropUnique(['matricula_id', 'competencia']);
            $table->dropConstrainedForeignId('matricula_id');
            $table->dropColumn('competencia');
        });
        Schema::table('pacientes', fn (Blueprint $t) => $t->dropColumn('dia_vencimento'));
    }
};
