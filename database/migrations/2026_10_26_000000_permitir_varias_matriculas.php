<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Um paciente pode ter várias matrículas; cada uma fica ativa ou encerrada. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('matriculas', function (Blueprint $table) {
            $table->dropUnique(['paciente_id']);
            $table->index('paciente_id');
            $table->string('status_matricula', 20)->default('ativa');
            $table->date('fim_da_matricula')->nullable();
        });

        // Paciente inativo não tinha agenda: a matrícula dele nasce encerrada, para o status derivado não reativá-lo.
        DB::table('matriculas')
            ->whereIn('paciente_id', DB::table('pacientes')->where('status_paciente', 'inativo')->select('id'))
            ->update(['status_matricula' => 'encerrada', 'fim_da_matricula' => today()]);
    }

    public function down(): void
    {
        Schema::table('matriculas', function (Blueprint $table) {
            $table->dropIndex(['paciente_id']);
            $table->dropColumn(['status_matricula', 'fim_da_matricula']);
            $table->unique('paciente_id');
        });
    }
};
