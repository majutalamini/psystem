<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Recuperação de senha e avisos por e-mail para a psicóloga.
 * As colunas aviso_* marcam o que já foi avisado, para não mandar o mesmo e-mail duas vezes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::table('agenda', function (Blueprint $table) {
            $table->timestampTz('aviso_enviado_em')->nullable();
        });
        Schema::table('cobrancas', function (Blueprint $table) {
            $table->timestampTz('aviso_vencimento_em')->nullable();
        });
        Schema::table('despesas', function (Blueprint $table) {
            $table->timestampTz('aviso_vencimento_em')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('despesas', fn (Blueprint $table) => $table->dropColumn('aviso_vencimento_em'));
        Schema::table('cobrancas', fn (Blueprint $table) => $table->dropColumn('aviso_vencimento_em'));
        Schema::table('agenda', fn (Blueprint $table) => $table->dropColumn('aviso_enviado_em'));
        Schema::dropIfExists('password_reset_tokens');
    }
};
