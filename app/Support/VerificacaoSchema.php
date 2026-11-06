<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use RuntimeException;

/** Política de persistência: catálogo real e migrations exigem classificação explícita. */
class VerificacaoSchema
{
    public const ESTADOS = [
        'pacientes.dia_vencimento', 'despesas_recorrentes.ativa', 'importacoes.anexado',
        'agenda.duracao_minutos', 'agenda.status', 'pacientes.status_paciente', 'cobrancas.situacao',
        'matriculas.status_matricula', 'pagamentos.data_pagamento', 'configuracoes.meta_faturamento_mensal',
        'configuracoes.meta_horas_semanais', 'configuracoes.meta_sessoes_semanais', 'configuracoes.meta_novos_pacientes_mes',
        'configuracoes.expediente_inicio', 'configuracoes.expediente_fim', 'configuracoes.duracao_sessao', 'configuracoes.intervalo_sessao',
    ];

    /** Hash de índice das tabelas do Laravel Pulse (monitoramento técnico, sem regra de negócio nem dado clínico). */
    private const GERADAS_TECNICAS = ['pulse_aggregates.key_hash', 'pulse_entries.key_hash', 'pulse_values.key_hash'];

    private const AUDITORIA = [
        'agenda.criado_em', 'anamnese_respostas.data_preenchimento', 'anamneses.criado_em', 'anamneses.atualizado_em',
        'despesas_recorrentes.criado_em',
        'cobrancas.criado_em', 'despesas.criado_em', 'documentos.criado_em', 'failed_jobs.failed_at',
        'matriculas.criado_em', 'pacientes.criado_em', 'pacientes.atualizado_em', 'prontuarios.criado_em', 'psicologos.criado_em',
    ];

    public static function catalogo(): array
    {
        $queries = [
            'tables' => "SELECT c.relname AS name, c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m') ORDER BY c.relname",
            'columns' => "SELECT c.relname AS table_name, a.attname AS name, format_type(a.atttypid,a.atttypmod) AS type, a.attnotnull AS not_null, pg_get_expr(d.adbin,d.adrelid) AS default_value, a.attidentity AS identity, a.attgenerated AS generated FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum WHERE n.nspname='public' AND c.relkind IN ('r','p') AND a.attnum>0 AND NOT a.attisdropped ORDER BY c.relname,a.attname",
            'constraints' => "SELECT t.relname AS table_name, c.conname AS name, c.contype AS type, c.condeferrable AS deferrable, c.condeferred AS initially_deferred, c.convalidated AS validated, pg_get_constraintdef(c.oid,true) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' ORDER BY t.relname,c.conname",
            'indexes' => "SELECT t.relname AS table_name, i.relname AS name, x.indisvalid AS is_valid, pg_get_indexdef(i.oid) AS definition FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid JOIN pg_class t ON t.oid=x.indrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' ORDER BY t.relname,i.relname",
            'sequences' => "SELECT sequencename AS name, data_type, start_value, min_value, max_value, increment_by, cycle, cache_size FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename",
        ];
        $result = [];
        foreach ($queries as $kind => $sql) {
            $result[$kind] = array_map(fn ($row) => (array) $row, DB::select($sql));
        }

        return $result;
    }

    public static function verificar(?string $manifesto = null, ?string $diretorioMigrations = null): array
    {
        if (DB::getDriverName() !== 'pgsql') {
            throw new RuntimeException('A checagem do schema exige PostgreSQL.');
        }
        $errors = [];
        $extraSchemas = DB::select("SELECT nspname FROM pg_namespace WHERE nspname !~ '^pg_' AND nspname NOT IN ('public','information_schema')");
        if ($extraSchemas) {
            $errors[] = 'Schemas de aplicação fora de public precisam de inventário e classificação.';
        }
        $triggers = DB::select("SELECT t.tgname FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_constraint k ON k.oid=t.tgconstraint WHERE n.nspname='public' AND NOT (t.tgisinternal AND coalesce(k.contype='f',false))");
        if ($triggers) {
            $errors[] = 'Trigger de aplicação proibido; somente mecanismos internos de FK são técnicos.';
        }
        if (DB::select("SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'")) {
            $errors[] = 'Função/procedure de aplicação proibida no schema.';
        }
        $catalog = self::catalogo();
        $states = array_fill_keys(self::ESTADOS, false);
        foreach ($catalog['columns'] as $column) {
            $key = $column['table_name'].'.'.$column['name'];
            $default = $column['default_value'];
            if (array_key_exists($key, $states)) {
                $states[$key] = $column['not_null'] && $default === null;
            }
            if ($column['generated'] !== '' && ! in_array($key, self::GERADAS_TECNICAS, true)) {
                $errors[] = "Coluna gerada exige decisão de domínio fora do banco: {$key}.";
            }
            // Coluna gerada técnica (hash do Pulse) aparece com a expressão de geração no lugar do default.
            if ($default === null || in_array($key, self::GERADAS_TECNICAS, true)) {
                continue;
            }
            $sequence = $column['name'] === 'id' && $default === "nextval('{$column['table_name']}_id_seq'::regclass)";
            $audit = in_array($key, self::AUDITORIA, true) && $default === 'CURRENT_TIMESTAMP';
            if (! $sequence && ! $audit) {
                $errors[] = "Default de negócio ou não classificado: {$key}.";
            }
        }
        foreach ($states as $key => $valid) {
            if (! $valid) {
                $errors[] = "Estado inicial exige NOT NULL sem default: {$key}.";
            }
        }
        foreach ($catalog['constraints'] as $constraint) {
            if ($constraint['type'] === 'c' && preg_match("/'(?:atrasado|convenio)'/", $constraint['definition'])) {
                $errors[] = 'Valor legado em '.$constraint['name'].'.';
            }
        }
        $manifest = json_decode(file_get_contents($manifesto ?? database_path('schema-permitido.json')), true, flags: JSON_THROW_ON_ERROR);
        foreach ($catalog as $kind => $rows) {
            $expected = $manifest['catalog'][$kind] ?? [];
            $actual = [];
            foreach ($rows as $row) {
                $key = ($row['table_name'] ?? '').'.'.$row['name'];
                $actual[$key] = $row;
                $classified = $expected[$key] ?? null;
                if (! $classified || ($classified['classification'] ?? '') !== 'integridade técnica'
                    || ! ($classified['reason'] ?? '') || ($classified['definition'] ?? null) !== $row) {
                    $errors[] = "Estrutura nova/alterada sem classificação correspondente: {$kind}:{$key}.";
                }
            }
            foreach (array_diff_key($expected, $actual) as $key => $_) {
                $errors[] = "Estrutura classificada ausente: {$kind}:{$key}.";
            }
        }
        $directory = $diretorioMigrations ?? database_path('migrations');
        $migrations = [];
        foreach (glob($directory.'/*.php') as $file) {
            $name = basename($file);
            $migrations[] = $name;
            $entry = $manifest['migrations'][$name] ?? null;
            if (! $entry || ! in_array($entry['classification'] ?? '', ['integridade técnica', 'legado'], true)
                || ! ($entry['reason'] ?? '') || ($entry['sha256'] ?? '') !== hash_file('sha256', $file)) {
                $errors[] = "Migration nova/alterada exige classificação: {$name}.";
            }
            $source = implode('', array_map(fn ($token) => is_array($token) ? (in_array($token[0], [T_COMMENT, T_DOC_COMMENT], true) ? '' : $token[1]) : $token, token_get_all(file_get_contents($file))));
            if (preg_match('/\bcreate\s+(?:or\s+replace\s+)?(?:constraint\s+)?(?:trigger|function|procedure)\b/i', $source)) {
                $errors[] = "Migration contém trigger/função/procedure: {$name}.";
            }
            // Apenas os arquivos históricos congelados podem conter os defaults antigos.
            if (($entry['classification'] ?? '') !== 'legado'
                && preg_match('/->\s*(?:default|useCurrent|useCurrentOnUpdate)\s*\(|\bset\s+default\b/i', $source)) {
                $errors[] = "Default em migration nova exige revisão técnica explícita na política: {$name}.";
            }
        }
        foreach (array_diff(array_keys($manifest['migrations']), $migrations) as $name) {
            $errors[] = "Migration classificada ausente: {$name}.";
        }
        if ($errors) {
            throw new RuntimeException(implode(PHP_EOL, $errors));
        }

        return ['catalogFingerprint' => hash('sha256', json_encode($catalog, JSON_THROW_ON_ERROR)),
            'elements' => array_sum(array_map(count(...), $catalog)), 'migrations' => count($migrations),
            'applicationTriggers' => 0, 'applicationRoutines' => 0, 'businessDefaults' => 0];
    }
}
