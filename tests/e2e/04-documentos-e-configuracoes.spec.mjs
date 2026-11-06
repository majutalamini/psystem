import { expect, test } from '@playwright/test';
import { entrar, esperarAviso } from './apoio.mjs';

test.beforeEach(async ({ page }) => { await entrar(page); });

test('preenche anamnese nova no perfil do paciente', async ({ page }) => {
  await page.goto('/pacientes');
  await page.getByRole('main').getByRole('row').nth(1).click();
  await expect(page).toHaveURL(/\/pacientes\/\d+$/);
  await page.getByRole('main').getByRole('button', { name: 'Anamnese', exact: true }).click();
  await page.getByRole('button', { name: 'Nova anamnese' }).click();
  await page.getByLabel('Título (opcional)').fill('Anamnese E2E');
  await page.getByRole('main').locator('textarea').first().fill('Resposta sintética de teste automatizado.');
  await page.getByRole('button', { name: 'Salvar anamnese' }).click();
  await esperarAviso(page, 'Anamnese salva.');
  await expect(page.locator('body')).toContainText('Anamnese E2E');
});

test('abre relatórios financeiros e de pacientes com dados', async ({ page }) => {
  await page.goto('/relatorios');
  for (const [categoria, relatorio] of [['Financeiro', 'Contas a receber'], ['Pacientes', 'Lista de pacientes']]) {
    await page.goto('/relatorios');
    const cartao = page.getByRole('main').locator('div')
      .filter({ has: page.getByText(categoria, { exact: true }) })
      .filter({ has: page.getByRole('button', { name: 'Acessar relatório' }) }).last();
    await cartao.getByRole('button', { name: 'Acessar relatório' }).click();
    await page.getByRole('main').locator('div')
      .filter({ has: page.getByText(relatorio, { exact: true }) })
      .filter({ has: page.getByRole('button', { name: 'Visualizar' }) }).last()
      .getByRole('button', { name: 'Visualizar' }).click();
    await expect(page.getByRole('main').getByRole('table')).toBeVisible();
    await expect(page.getByRole('main').getByRole('row').nth(1)).toBeVisible();
  }
});

test('gera declaração de acompanhamento com os dados do paciente', async ({ page }) => {
  await page.goto('/declaracoes');
  await page.getByRole('button', { name: 'Gerar declaração' }).nth(1).click();
  const seletor = page.getByLabel('Paciente', { exact: true });
  await expect(seletor).toBeEnabled();
  const nome = (await seletor.locator('option:not([value=""])').first().innerText()).trim();
  await seletor.selectOption({ label: nome });
  await expect(seletor).toBeEnabled();
  await page.getByRole('button', { name: 'Gerar documento' }).click();
  await expect(page.getByRole('heading', { name: 'Documento gerado' })).toBeVisible();
  await expect(page.getByText(`Declaro, para os devidos fins, que ${nome} encontra-se em acompanhamento psicológico`)).toBeVisible();
});

test('limite de consultas simultâneas é salvo e pode voltar a vazio', async ({ page }) => {
  await page.goto('/configuracoes');
  await page.getByText('Horário de atendimento', { exact: true }).first().click();
  const limite = page.getByLabel('Consultas simultâneas por horário');
  await limite.fill('2');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByText('Alterações salvas com sucesso.').first()).toBeVisible();

  await page.reload();
  await page.getByText('Horário de atendimento', { exact: true }).first().click();
  await expect(page.getByLabel('Consultas simultâneas por horário')).toHaveValue('2');
  await page.getByLabel('Consultas simultâneas por horário').fill('');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByText('Alterações salvas com sucesso.').first()).toBeVisible();
});
