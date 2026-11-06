<?php

namespace Tests\Feature;

use App\Support\VerificacaoSchema;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Symfony\Component\Process\Process;

class VerificacaoSchemaTest extends ConsultorioTestCase
{
    public function test_comando_recusa_ambiente_fora_do_banco_isolado_com_codigo_de_erro(): void
    {
        $process = new Process([PHP_BINARY, base_path('scripts/verificar-schema.php')], base_path(), ['APP_ENV' => 'local']);
        $process->run();
        $this->assertFalse($process->isSuccessful());
        $this->assertStringContainsString('schema de testes PostgreSQL isolado', $process->getErrorOutput());
    }

    private function recusa(string $message, ?string $migrations = null): void
    {
        try {
            VerificacaoSchema::verificar(diretorioMigrations: $migrations);
            $this->fail('O schema não classificado deveria reprovar.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString($message, $exception->getMessage());
        }
    }

    public function test_schema_migrado_mantem_auditoria_check_e_integridade_referencial_tecnicos(): void
    {
        $result = VerificacaoSchema::verificar();
        $this->assertSame(0, $result['businessDefaults']);
        $this->assertSame(0, $result['applicationRoutines']);
        $this->assertSame(0, $result['applicationTriggers']);
        $this->assertGreaterThan(250, $result['elements']);
    }

    public function test_bloqueia_default_de_negocio_no_catalogo_real(): void
    {
        DB::statement('ALTER TABLE configuracoes ALTER COLUMN duracao_sessao SET DEFAULT 50');
        $this->recusa('Default de negócio ou não classificado: configuracoes.duracao_sessao');
    }

    public function test_bloqueia_funcao_e_trigger_de_aplicacao_reais(): void
    {
        DB::unprepared('CREATE FUNCTION public.schema_probe() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$');
        $this->recusa('Função/procedure de aplicação proibida');
        DB::unprepared('CREATE TRIGGER schema_probe BEFORE UPDATE ON configuracoes FOR EACH ROW EXECUTE FUNCTION public.schema_probe()');
        $this->recusa('Trigger de aplicação proibido');
    }

    public function test_estrutura_nova_exige_classificacao_ate_se_nao_tem_default(): void
    {
        DB::statement('ALTER TABLE configuracoes ADD COLUMN schema_probe text');
        $this->recusa('Estrutura nova/alterada sem classificação correspondente: columns:configuracoes.schema_probe');
    }

    public function test_migration_nova_e_codigo_sql_proibido_sao_bloqueados_antes_da_execucao(): void
    {
        $directory = sys_get_temp_dir().'/psystem-migration-'.bin2hex(random_bytes(8));
        mkdir($directory);
        $file = $directory.'/2099_01_01_nova.php';
        try {
            file_put_contents($file, '<?php DB::statement("CREATE FUNCTION proibida() RETURNS integer LANGUAGE sql AS \'SELECT 1\'");');
            $this->recusa('Migration nova/alterada exige classificação: 2099_01_01_nova.php', $directory);
            $this->recusa('Migration contém trigger/função/procedure', $directory);
        } finally {
            unlink($file);
            rmdir($directory);
        }
    }
}
