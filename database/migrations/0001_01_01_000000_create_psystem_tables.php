<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * Modelo do sistema (modelo_sistema_psicologia.sql) com os ajustes de docs/decisoes.md.
 * Os ENUMs do Postgres viraram colunas com CHECK (o jeito do Laravel), com os mesmos valores.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('psicologos', function (Blueprint $table) {
            $table->id();
            $table->string('nome', 150);
            $table->string('crp', 20)->unique();
            $table->string('email', 150)->unique();
            $table->string('telefone', 20)->nullable();
            $table->string('senha_hash');
            $table->string('foto')->nullable();
            $table->rememberToken();
            $table->timestampTz('criado_em')->useCurrent();
        });

        Schema::create('pacientes', function (Blueprint $table) {
            $table->id();
            $table->string('nome', 150)->index();
            $table->char('cpf', 11)->unique();
            $table->string('telefone', 20);
            $table->string('email', 150)->nullable();
            $table->date('data_nascimento');
            $table->enum('sexo', ['masculino', 'feminino', 'outro', 'prefiro_nao_informar'])->nullable();
            $table->string('endereco')->nullable();
            $table->string('endereco_cidade', 80)->nullable();
            $table->char('endereco_uf', 2)->nullable();
            $table->string('convenio', 60)->nullable();
            $table->string('contato_emergencia_nome', 150)->nullable();
            $table->string('contato_emergencia_telefone', 20)->nullable();
            $table->text('observacoes')->nullable();
            $table->string('status_paciente', 30)->default('ativo');
            $table->string('foto')->nullable();
            $table->timestampTz('criado_em')->useCurrent();
            $table->timestampTz('atualizado_em')->useCurrent();
        });

        // Uma matrícula por paciente: o horário fixo semanal e o valor da sessão.
        Schema::create('matriculas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paciente_id')->unique()->constrained('pacientes')->cascadeOnDelete();
            $table->date('inicio_da_matricula');
            $table->time('horario_da_matricula');
            $table->string('dia_da_matricula', 20); // ex: segunda-feira
            $table->enum('tipo_da_consulta', ['presencial', 'online']);
            $table->decimal('valor_sessao', 10, 2);
            $table->timestampTz('criado_em')->useCurrent();
        });

        Schema::create('agenda', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paciente_id')->index()->constrained('pacientes')->restrictOnDelete();
            $table->foreignId('matricula_id')->nullable()->constrained('matriculas')->nullOnDelete();
            $table->timestampTz('data_hora_consulta')->index();
            $table->integer('duracao_minutos')->default(50);
            $table->enum('modalidade', ['presencial', 'online']);
            $table->enum('status', ['agendado', 'confirmado', 'realizado', 'cancelado', 'falta'])->default('agendado');
            $table->timestampTz('criado_em')->useCurrent();
        });
        // Profissional único: não pode haver duas consultas ativas no mesmo horário.
        DB::statement("CREATE UNIQUE INDEX agenda_horario_unico ON agenda (data_hora_consulta) WHERE status <> 'cancelado'");

        Schema::create('prontuarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paciente_id')->index()->constrained('pacientes')->restrictOnDelete();
            $table->foreignId('psicologo_id')->constrained('psicologos')->restrictOnDelete();
            $table->foreignId('agenda_id')->nullable()->constrained('agenda')->nullOnDelete();
            $table->date('data_atendimento');
            $table->text('tecnicas')->nullable();
            $table->text('objetivo')->nullable();
            $table->text('observacoes_consulta');
            $table->timestampTz('criado_em')->useCurrent();
        });

        Schema::create('anamnese_modelos', function (Blueprint $table) {
            $table->id();
            $table->string('titulo', 150);
        });

        Schema::create('anamnese_perguntas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('anamnese_modelo_id')->index()->constrained('anamnese_modelos')->cascadeOnDelete();
            $table->string('categoria', 80)->nullable();
            $table->text('texto_pergunta');
            $table->enum('tipo_pergunta', ['texto_livre', 'multipla_escolha', 'sim_nao', 'escala_numerica', 'data']);
        });

        Schema::create('anamnese_respostas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paciente_id')->index()->constrained('pacientes')->cascadeOnDelete();
            $table->foreignId('psicologo_id')->constrained('psicologos');
            $table->foreignId('pergunta_id')->constrained('anamnese_perguntas');
            $table->text('valor_resposta');
            $table->timestampTz('data_preenchimento')->useCurrent();
        });

        Schema::create('cobrancas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paciente_id')->index()->constrained('pacientes')->restrictOnDelete();
            $table->foreignId('agenda_id')->nullable()->constrained('agenda')->nullOnDelete();
            $table->string('titulo', 200);
            $table->decimal('valor', 10, 2);
            $table->date('vencimento');
            $table->enum('situacao', ['pendente', 'pago', 'atrasado', 'cancelado'])->default('pendente')->index();
            $table->timestampTz('criado_em')->useCurrent();
        });

        Schema::create('pagamentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cobranca_id')->index()->constrained('cobrancas')->cascadeOnDelete();
            $table->decimal('valor_pago', 10, 2);
            $table->enum('metodo_pagamento', ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'convenio', 'transferencia']);
            $table->timestampTz('data_pagamento')->useCurrent();
        });

        // Contas a pagar do consultório.
        Schema::create('despesas', function (Blueprint $table) {
            $table->id();
            $table->string('descricao', 200);
            $table->string('categoria', 40);
            $table->decimal('valor', 10, 2);
            $table->date('vencimento');
            $table->date('pago_em')->nullable();
            $table->decimal('valor_pago', 10, 2)->nullable();
            $table->enum('metodo_pagamento', ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'convenio', 'transferencia'])->nullable();
            $table->timestampTz('criado_em')->useCurrent();
        });

        Schema::create('documentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paciente_id')->index()->constrained('pacientes')->cascadeOnDelete();
            $table->string('titulo', 150);
            $table->string('nome_arquivo');
            $table->string('caminho');
            $table->integer('tamanho');
            $table->timestampTz('criado_em')->useCurrent();
        });

        // Uma linha só: metas, WhatsApp e expediente.
        Schema::create('configuracoes', function (Blueprint $table) {
            $table->id();
            $table->decimal('meta_faturamento_mensal', 10, 2)->default(0);
            $table->integer('meta_horas_semanais')->default(0);
            $table->integer('meta_sessoes_semanais')->default(0);
            $table->integer('meta_novos_pacientes_mes')->default(0);
            $table->boolean('whatsapp_ativo')->default(false);
            $table->string('whatsapp_numero', 20)->nullable();
            $table->integer('whatsapp_dias_antes')->default(2);
            $table->text('mensagem_lembrete')->nullable();
            $table->text('mensagem_retorno')->nullable();
            $table->text('mensagem_cobranca')->nullable();
            $table->json('dias_atendimento'); // ["Seg", "Ter", ...]
            $table->time('expediente_inicio')->default('08:00');
            $table->time('expediente_fim')->default('18:00');
            $table->integer('duracao_sessao')->default(50);
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        foreach ([
            'sessions', 'configuracoes', 'documentos', 'despesas', 'pagamentos', 'cobrancas',
            'anamnese_respostas', 'anamnese_perguntas', 'anamnese_modelos', 'prontuarios',
            'agenda', 'matriculas', 'pacientes', 'psicologos',
        ] as $tabela) {
            Schema::dropIfExists($tabela);
        }
    }
};
