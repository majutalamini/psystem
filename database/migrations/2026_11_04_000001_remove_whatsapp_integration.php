<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('mensagens_whatsapp');

        Schema::table('pacientes', function (Blueprint $table) {
            $table->dropColumn('aceita_whatsapp');
        });

        Schema::table('configuracoes', function (Blueprint $table) {
            $table->dropColumn([
                'whatsapp_ativo', 'whatsapp_numero', 'whatsapp_dias_antes',
                'mensagem_lembrete', 'mensagem_retorno', 'mensagem_cobranca',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('configuracoes', function (Blueprint $table) {
            $table->boolean('whatsapp_ativo')->default(false);
            $table->string('whatsapp_numero', 20)->nullable();
            $table->integer('whatsapp_dias_antes')->default(2);
            $table->text('mensagem_lembrete')->nullable();
            $table->text('mensagem_retorno')->nullable();
            $table->text('mensagem_cobranca')->nullable();
        });

        // Restaura a estrutura anterior; mensagens removidas não são recuperadas.
        $anterior = require __DIR__.'/2026_09_27_000002_create_mensagens_whatsapp.php';
        $anterior->up();
    }
};
