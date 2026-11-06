import { expect, test } from '@playwright/test';
import { entrar, LOGIN } from './apoio.mjs';

const TELAS = [
  ['/', 'Dashboard'], ['/agenda', 'Agenda'], ['/pacientes', 'Pacientes'], ['/prontuarios', 'Prontuários'],
  ['/anamneses', 'Anamneses'], ['/importacoes', 'Importações'], ['/relatorios', 'Relatórios'],
  ['/declaracoes', 'Declarações'], ['/financeiro', 'Financeiro'], ['/configuracoes', 'Configurações'],
];

test('visitante é mandado ao login em qualquer tela e em arquivos', async ({ page }) => {
  for (const [url] of [...TELAS, ['/pacientes/1'], ['/pacientes/1/foto'], ['/documentos/1']]) {
    await page.goto(url);
    await expect(page, url).toHaveURL(/\/login$/);
  }
});

test('senha errada é recusada sem revelar se a conta existe', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(LOGIN.email);
  await page.getByLabel('Senha', { exact: true }).fill('senha-errada');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('todas as telas abrem sem erro de JavaScript', async ({ page }) => {
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  page.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  await entrar(page);
  for (const [url, titulo] of TELAS) {
    await page.goto(url);
    await expect(page.locator('body'), url).toContainText(titulo);
  }
  expect(erros).toEqual([]);
});

test('sair encerra a sessão', async ({ page }) => {
  await entrar(page);
  await page.getByRole('button', { name: 'Sair' }).first().click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/agenda');
  await expect(page).toHaveURL(/\/login$/);
});
