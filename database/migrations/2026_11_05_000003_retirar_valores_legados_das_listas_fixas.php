<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE cobrancas DROP CONSTRAINT cobrancas_situacao_check');
        DB::statement("ALTER TABLE cobrancas ADD CONSTRAINT cobrancas_situacao_check CHECK (situacao IN ('pendente', 'pago', 'cancelado'))");
        foreach (['pagamentos', 'despesas'] as $table) {
            DB::statement("ALTER TABLE {$table} DROP CONSTRAINT {$table}_metodo_pagamento_check");
            DB::statement("ALTER TABLE {$table} ADD CONSTRAINT {$table}_metodo_pagamento_check CHECK (metodo_pagamento IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia'))");
        }
    }

    public function down(): void
    {
        throw new LogicException('Retorne ao commit local anterior e recrie o banco sintético com suas migrations e seeders.');
    }
};
