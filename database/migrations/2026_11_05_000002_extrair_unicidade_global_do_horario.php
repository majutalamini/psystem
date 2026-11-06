<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('DROP INDEX agenda_horario_unico');
        DB::statement("CREATE UNIQUE INDEX agenda_paciente_horario_unico ON agenda (paciente_id, data_hora_consulta) WHERE status <> 'cancelado'");
        // agenda_data_hora_consulta_index permanece intacto para os intervalos.
    }

    public function down(): void
    {
        throw new LogicException('Retorne ao commit local anterior e recrie o banco de testes com suas migrations e seeders. A regra global não volta ao banco pelo código desta etapa.');
    }
};
