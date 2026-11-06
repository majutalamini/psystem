import { defineConfig } from '@playwright/test';

// Etapa 3. Um worker: os roteiros compartilham o banco psystem_e2e recriado por scripts/e2e.sh e rodam em ordem.
export default defineConfig({
  testDir: 'tests/e2e',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  outputDir: 'artifacts/e2e/resultados',
  reporter: [['list'], ['json', { outputFile: 'artifacts/e2e/relatorio.json' }]],
  use: {
    baseURL: 'http://localhost:8002',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
