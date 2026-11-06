<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Etapa 2F. Despesa passa a ter pagamentos (pode ser paga em partes), como a cobrança.
 * Estorno de qualquer pagamento é específico e fica registrado (data, autor, motivo); o
 * pagamento estornado continua gravado e sai da soma. A chave identifica cada envio:
 * o mesmo pagamento enviado duas vezes não é gravado duas vezes.
 * A baixa única antiga de cada despesa vira um pagamento (uma vez só) e as colunas saem.
 */
return new class extends Migration
{
    private const METODOS = ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia'];

    public function up(): void
    {
        Schema::table('pagamentos', function (Blueprint $table) {
            $table->timestampTz('estornado_em')->nullable();
            $table->foreignId('estornado_por')->nullable()->constrained('psicologos')->restrictOnDelete();
            $table->string('motivo_estorno', 200)->nullable();
            $table->string('chave', 64)->nullable()->unique();
        });

        Schema::create('despesa_pagamentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('despesa_id')->index()->constrained('despesas')->restrictOnDelete();
            $table->decimal('valor_pago', 10, 2);
            $table->enum('metodo_pagamento', self::METODOS);
            $table->timestampTz('data_pagamento');
            $table->timestampTz('criado_em');
            $table->timestampTz('estornado_em')->nullable();
            $table->foreignId('estornado_por')->nullable()->constrained('psicologos')->restrictOnDelete();
            $table->string('motivo_estorno', 200)->nullable();
            $table->string('chave', 64)->nullable()->unique();
        });

        // Importa cada baixa existente uma única vez. Não inventa dados que o modelo antigo não guardou.
        foreach (DB::table('despesas')->whereNotNull('pago_em')->orderBy('id')->get() as $despesa) {
            if ($despesa->metodo_pagamento === null || ! in_array($despesa->metodo_pagamento, self::METODOS, true)) {
                throw new RuntimeException("Despesa {$despesa->id} tem baixa sem forma de pagamento válida; corrija antes de migrar.");
            }
            DB::table('despesa_pagamentos')->insert([
                'despesa_id' => $despesa->id,
                // Baixa sem valor informado quitava o valor original; com valor menor, a diferença reabre.
                'valor_pago' => $despesa->valor_pago ?? $despesa->valor,
                'metodo_pagamento' => $despesa->metodo_pagamento,
                'data_pagamento' => $despesa->pago_em,
                'criado_em' => now(),
            ]);
        }

        Schema::table('despesas', function (Blueprint $table) {
            $table->dropColumn(['pago_em', 'valor_pago', 'metodo_pagamento']);
        });
    }

    public function down(): void
    {
        throw new LogicException('Retorno por restauração: recrie os bancos sintéticos com as migrations anteriores. Pagamentos parciais e estornos não cabem na baixa única.');
    }
};
