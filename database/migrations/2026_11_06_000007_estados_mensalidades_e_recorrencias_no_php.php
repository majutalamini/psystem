<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE pacientes ALTER COLUMN dia_vencimento DROP DEFAULT');
        DB::statement('ALTER TABLE despesas_recorrentes ALTER COLUMN ativa DROP DEFAULT');
    }

    public function down(): void
    {
        throw new LogicException('Os estados iniciais são definidos pelo PHP; os defaults de negócio não são restaurados.');
    }
};
