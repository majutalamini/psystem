import { spawnSync } from 'node:child_process';

// Os nomes são fixos; não aceita SQL nem nomes de banco vindos da linha de comando.
const sql = "SELECT 'CREATE DATABASE psystem_test' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'psystem_test')\n\\gexec\n";
const result = spawnSync('docker', ['compose', 'exec', '-T', 'db', 'sh', '-c',
  'exec psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres'], { input: sql, stdio: ['pipe', 'inherit', 'inherit'] });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
