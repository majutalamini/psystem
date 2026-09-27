<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Envio automático pelo WhatsApp: consentimento do paciente e registro de cada mensagem
 * (simulada no modo teste, enviada ou com erro no modo twilio).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pacientes', function (Blueprint $table) {
            $table->boolean('aceita_whatsapp')->default(false);
        });

        Schema::create('mensagens_whatsapp', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paciente_id')->nullable()->constrained('pacientes')->nullOnDelete();
            $table->foreignId('agenda_id')->nullable()->constrained('agenda')->nullOnDelete();
            $table->foreignId('cobranca_id')->nullable()->constrained('cobrancas')->nullOnDelete();
            $table->string('tipo', 20); // lembrete, cobranca, teste
            $table->string('telefone', 20);
            $table->text('texto');
            $table->string('situacao', 20); // simulada, enviada, erro
            $table->string('id_externo', 64)->nullable();
            $table->text('erro')->nullable();
            $table->timestampTz('criado_em')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mensagens_whatsapp');
        Schema::table('pacientes', fn (Blueprint $table) => $table->dropColumn('aceita_whatsapp'));
    }
};
