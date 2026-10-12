<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Um paciente passa a ter várias anamneses; cada conjunto de respostas pertence a uma delas. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('anamneses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paciente_id')->index()->constrained('pacientes')->cascadeOnDelete();
            $table->foreignId('psicologo_id')->constrained('psicologos');
            $table->string('titulo', 150)->nullable();
            $table->timestampTz('criado_em')->useCurrent();
            $table->timestampTz('atualizado_em')->useCurrent();
        });

        Schema::table('anamnese_respostas', function (Blueprint $table) {
            $table->foreignId('anamnese_id')->nullable()->after('id')->index()->constrained('anamneses')->cascadeOnDelete();
        });

        // As respostas que já existem (uma anamnese por paciente) viram a primeira anamnese de cada um.
        $pacientes = DB::table('anamnese_respostas')
            ->selectRaw('paciente_id, max(psicologo_id) as psicologo_id, min(data_preenchimento) as criado, max(data_preenchimento) as atualizado')
            ->groupBy('paciente_id')
            ->get();

        foreach ($pacientes as $p) {
            $id = DB::table('anamneses')->insertGetId([
                'paciente_id' => $p->paciente_id,
                'psicologo_id' => $p->psicologo_id,
                'criado_em' => $p->criado,
                'atualizado_em' => $p->atualizado,
            ]);
            DB::table('anamnese_respostas')->where('paciente_id', $p->paciente_id)->update(['anamnese_id' => $id]);
        }
    }

    public function down(): void
    {
        Schema::table('anamnese_respostas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('anamnese_id');
        });
        Schema::dropIfExists('anamneses');
    }
};
