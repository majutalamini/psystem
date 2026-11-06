<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Não altera tipo nem NOT NULL. Os escritores PHP já fornecem o estado.
        foreach ([
            'pacientes' => ['status_paciente'],
            'agenda' => ['duracao_minutos', 'status'],
            'cobrancas' => ['situacao'],
            'matriculas' => ['status_matricula'],
            'pagamentos' => ['data_pagamento'],
            'configuracoes' => ['meta_faturamento_mensal', 'meta_horas_semanais', 'meta_sessoes_semanais',
                'meta_novos_pacientes_mes', 'expediente_inicio', 'expediente_fim', 'duracao_sessao', 'intervalo_sessao'],
        ] as $table => $columns) {
            foreach ($columns as $column) {
                DB::statement('ALTER TABLE "'.$table.'" ALTER COLUMN "'.$column.'" DROP DEFAULT');
            }
        }
    }

    public function down(): void
    {
        throw new LogicException('Para retornar à etapa 0, reverta o código local e recrie o banco de testes com migrate:fresh --seed. Defaults de negócio não são restaurados pelo código desta etapa.');
    }
};
