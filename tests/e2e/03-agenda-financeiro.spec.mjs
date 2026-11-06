import { expect, test } from '@playwright/test';
import { entrar, esperarAviso, sufixo } from './apoio.mjs';

test.describe.configure({ mode: 'serial' });

// Próxima segunda-feira (dentro da janela da agenda): o seed tem matrícula às 08:00.
function proximaSegunda() {
  const d = new Date();
  d.setDate(d.getDate() + (((8 - d.getDay()) % 7) || 7));
  return d;
}
const segunda = proximaSegunda();
const segundaIso = `${segunda.getFullYear()}-${String(segunda.getMonth() + 1).padStart(2, '0')}-${String(segunda.getDate()).padStart(2, '0')}`;
const segundaBr = segunda.toLocaleDateString('pt-BR');
const pacienteDaSessao = 'Paciente E2E';

test.beforeEach(async ({ page }) => { await entrar(page); });

test('agenda consulta avulsa escolhendo paciente e horário livre', async ({ page }) => {
  await page.goto(`/agenda?data=${segundaIso}`);
  await page.getByRole('button', { name: 'Novo agendamento' }).click();
  const seletor = page.getByLabel('Paciente', { exact: true });
  await expect(seletor.locator('option').nth(1)).toBeAttached();
  await seletor.selectOption({ label: pacienteDaSessao });
  await page.getByLabel('Horário', { exact: true }).fill('09:00');
  await page.getByLabel('Valor da consulta', { exact: true }).fill('150');
  await page.getByRole('button', { name: 'Agendar', exact: true }).click();
  await esperarAviso(page, 'Consulta agendada.');
});

test('consulta avulsa já aparece como cobrança no financeiro', async ({ page }) => {
  await page.goto('/financeiro');
  const linha = page.getByRole('row').filter({ hasText: pacienteDaSessao }).filter({ hasText: `Consulta avulsa — ${segundaBr}` });
  await expect(linha).toBeVisible();
  await expect(linha).toContainText('R$ 150,00');
});

test('recebe em parte e estorna esse recebimento com motivo', async ({ page }) => {
  await page.goto('/financeiro');
  const linha = page.getByRole('row').filter({ hasText: pacienteDaSessao }).filter({ hasText: `Consulta avulsa — ${segundaBr}` });
  await linha.getByRole('button', { name: 'RECEBER' }).click();
  await page.getByLabel('Valor recebido (R$)').fill('50');
  await page.getByRole('button', { name: 'Confirmar recebimento' }).click();
  await esperarAviso(page, 'Recebimento registrado.');
  await expect(linha).toContainText('R$ 50,00 recebido');

  await linha.getByRole('button', { name: 'Mais ações' }).click();
  await page.getByRole('button', { name: 'Pagamentos e estornos' }).click();
  await page.getByRole('button', { name: 'Estornar', exact: true }).click();
  await page.locator('.swal2-input').fill('Teste automatizado de estorno');
  await page.locator('.swal2-popup').getByRole('button', { name: 'Estornar', exact: true }).click();
  await esperarAviso(page, 'Recebimento estornado.');
  await expect(page.getByText('Estornado em')).toBeVisible();
  await expect(page.getByText('Teste automatizado de estorno')).toBeVisible();
});

test('despesa paga em partes mostra o saldo', async ({ page }) => {
  const descricao = `Despesa E2E ${sufixo()}`;
  await page.goto('/financeiro');
  await page.getByRole('button', { name: 'Contas a pagar' }).click();
  await page.getByRole('button', { name: 'Nova conta a pagar' }).click();
  await page.getByLabel('Descrição').fill(descricao);
  await page.getByLabel('Valor (R$)').fill('300');
  await page.getByRole('button', { name: 'Adicionar' }).click();
  await esperarAviso(page, 'Despesa criada.');

  const linha = page.getByRole('row').filter({ hasText: descricao });
  await linha.getByRole('button', { name: 'PAGAR' }).click();
  await page.getByLabel('Valor pago (R$)').fill('100');
  await page.getByRole('button', { name: 'Confirmar pagamento' }).click();
  await esperarAviso(page, 'Pagamento registrado.');
  await expect(linha).toContainText('R$ 100,00 pago · falta R$ 200,00');
  await expect(linha).toContainText('em parte');
});
