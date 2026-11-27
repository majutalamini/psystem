<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * Contratos (pacote de sessões que renova sozinho), responsáveis de pacientes menores e notificações lidas.
 * O status do paciente passa a vir do contrato: ativo, bloqueado (inadimplente) ou inativo (sem contrato).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('responsaveis', function (Blueprint $table) {
            $table->id();
            $table->string('nome', 150)->index();
            $table->char('cpf', 11)->nullable()->unique();
            $table->string('telefone', 20);
            $table->string('email', 150)->nullable();
            $table->string('endereco')->nullable();
            $table->text('observacoes')->nullable();
            $table->timestampTz('criado_em')->useCurrent();
            $table->timestampTz('atualizado_em')->useCurrent();
        });

        Schema::table('pacientes', function (Blueprint $table) {
            $table->foreignId('responsavel_id')->nullable()->constrained('responsaveis')->nullOnDelete();
            $table->string('responsavel_parentesco', 40)->nullable();
        });

        // Um ciclo = sessoes_pacote sessões a partir de ciclo_inicio; ciclo_fim é a data da última sessão do ciclo.
        Schema::create('contratos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paciente_id')->index()->constrained('pacientes')->restrictOnDelete();
            $table->unsignedSmallInteger('sessoes_pacote');
            $table->decimal('valor_pacote', 10, 2);
            $table->date('data_inicio');
            $table->string('status', 20)->default('ativo')->index(); // ativo | bloqueado | encerrado
            $table->date('encerrado_em')->nullable();
            $table->unsignedInteger('ciclo_atual')->default(1);
            $table->date('ciclo_inicio');
            $table->date('ciclo_fim')->nullable();
            $table->timestampTz('criado_em')->useCurrent();
            $table->timestampTz('atualizado_em')->useCurrent();
        });

        Schema::table('matriculas', function (Blueprint $table) {
            $table->foreignId('contrato_id')->nullable()->constrained('contratos')->nullOnDelete();
        });

        // Cobrança do pacote: uma por contrato e ciclo.
        Schema::table('cobrancas', function (Blueprint $table) {
            $table->foreignId('contrato_id')->nullable()->constrained('contratos')->nullOnDelete();
            $table->unsignedInteger('ciclo')->nullable();
            $table->unique(['contrato_id', 'ciclo']);
        });

        Schema::create('notificacoes_lidas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('psicologo_id')->constrained('psicologos')->cascadeOnDelete();
            $table->string('chave', 120);
            $table->timestampTz('lida_em')->useCurrent();
            $table->unique(['psicologo_id', 'chave']);
        });

        // Matrículas ativas que já existiam viram um contrato (4 sessões por horário, valor = soma das mensalidades).
        // O ciclo começa hoje sem nova cobrança: as mensalidades já lançadas continuam valendo.
        $hoje = now()->toDateString();
        $porPaciente = DB::table('matriculas')->where('status_matricula', 'ativa')->get()->groupBy('paciente_id');
        foreach ($porPaciente as $pacienteId => $matriculas) {
            $contratoId = DB::table('contratos')->insertGetId([
                'paciente_id' => $pacienteId,
                'sessoes_pacote' => 4 * $matriculas->count(),
                'valor_pacote' => $matriculas->sum('valor_sessao'),
                'data_inicio' => $hoje,
                'status' => 'ativo',
                'ciclo_atual' => 1,
                'ciclo_inicio' => $hoje,
            ]);
            DB::table('matriculas')->whereIn('id', $matriculas->pluck('id'))->update(['contrato_id' => $contratoId]);
        }

        DB::table('pacientes')->whereNotIn('id', $porPaciente->keys()->all())->update(['status_paciente' => 'inativo']);
        DB::table('pacientes')->whereIn('id', $porPaciente->keys()->all())->update(['status_paciente' => 'ativo']);
    }

    public function down(): void
    {
        Schema::dropIfExists('notificacoes_lidas');
        Schema::table('cobrancas', function (Blueprint $table) {
            $table->dropUnique(['contrato_id', 'ciclo']);
            $table->dropConstrainedForeignId('contrato_id');
            $table->dropColumn('ciclo');
        });
        Schema::table('matriculas', fn (Blueprint $t) => $t->dropConstrainedForeignId('contrato_id'));
        Schema::dropIfExists('contratos');
        Schema::table('pacientes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('responsavel_id');
            $table->dropColumn('responsavel_parentesco');
        });
        Schema::dropIfExists('responsaveis');
        DB::table('pacientes')->where('status_paciente', 'bloqueado')->update(['status_paciente' => 'ativo']);
    }
};
