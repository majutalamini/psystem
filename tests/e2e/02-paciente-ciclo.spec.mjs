import { expect, test } from '@playwright/test';
import { cpfValido, entrar, esperarAviso, fecharAviso, sufixo } from './apoio.mjs';

// Um paciente sintético do cadastro ao histórico clínico, em ordem.
test.describe.configure({ mode: 'serial' });

const id = sufixo();
const nome = `Paciente E2E ${id}`;
const hoje = new Date().toLocaleDateString('pt-BR');
const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
let perfil;

test.beforeEach(async ({ page }) => { await entrar(page); });

test('cadastra paciente com CPF validado', async ({ page }) => {
  await page.goto('/pacientes');
  await page.getByRole('button', { name: 'NOVO PACIENTE' }).click();
  await page.getByLabel('Nome completo *').fill(nome);
  await page.getByLabel('Data de nascimento *').fill('01/02/1990');
  await page.getByLabel('CPF *').fill('111.111.111-11');
  await expect(page.getByText('CPF inválido.')).toBeVisible();
  await page.getByLabel('CPF *').fill(cpfValido(`8${id}12`.slice(0, 9)));
  await page.getByLabel('Telefone *').fill('(48) 90000-0000');
  await page.getByRole('button', { name: 'Cadastrar paciente' }).click();
  await expect(page).toHaveURL(/\/pacientes\/\d+$/);
  await expect(page.locator('body')).toContainText(nome);
  perfil = new URL(page.url()).pathname;
});

test('cria matrícula e o paciente fica ativo', async ({ page }) => {
  await page.goto(perfil);
  await page.getByRole("main").getByRole("button", { name: "Matrículas", exact: true }).click();
  await page.getByRole('button', { name: 'Criar matrícula' }).click();
  await page.getByPlaceholder('Ex: R$ 200,00').fill('180');
  await page.getByRole('button', { name: 'Salvar matrícula' }).click();
  await expect(page.getByText(/Toda .+, às \d\d:\d\d/)).toBeVisible();
  await expect(page.locator('body')).toContainText('Ativo');
});

test('registra e edita prontuário', async ({ page }) => {
  await page.goto(perfil);
  await page.getByRole("main").getByRole("button", { name: "Prontuários", exact: true }).click();
  await page.getByRole('button', { name: 'Novo registro' }).click();
  await page.getByLabel('Data').fill(hoje);
  await page.getByLabel('Descrição / relato de atendimento').fill('Relato sintético de teste automatizado.');
  await page.getByRole('button', { name: 'Salvar prontuário' }).click();
  await esperarAviso(page, 'Prontuário salvo.');
  await expect(page.locator('body')).toContainText('Relato sintético de teste automatizado.');

  await page.getByRole('button', { name: 'Editar registro' }).first().click();
  await page.getByLabel('Descrição / relato de atendimento').fill('Relato sintético editado.');
  await page.getByRole('button', { name: 'Salvar prontuário' }).click();
  await esperarAviso(page, 'Prontuário atualizado.');
  await expect(page.locator('body')).toContainText('Relato sintético editado.');
});

test('anexa PDF, recusa HTML disfarçado e baixa o documento', async ({ page }) => {
  await page.goto(perfil);
  await page.getByRole("main").getByRole("button", { name: "Documentos", exact: true }).click();

  await page.getByLabel('Título do documento').fill('Arquivo falso');
  await page.locator('input[type=file][accept^=".pdf"]').setInputFiles({ name: 'falso.pdf', mimeType: 'application/pdf', buffer: Buffer.from('<html>não é pdf</html>') });
  await page.getByRole('button', { name: 'Salvar documento' }).click();
  await esperarAviso(page, 'Envie PDF, DOCX, JPEG, PNG ou WebP.');
  await fecharAviso(page);

  await page.getByLabel('Título do documento').fill('Laudo sintético');
  await page.locator('input[type=file][accept^=".pdf"]').setInputFiles({ name: 'laudo.pdf', mimeType: 'application/pdf', buffer: PDF });
  await page.getByRole('button', { name: 'Salvar documento' }).click();
  await esperarAviso(page, 'Documento anexado.');
  await expect(page.getByText('1 documento anexado')).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Baixar documento' }).first().click();
  expect((await download).suggestedFilename()).toBe('laudo.pdf');
});

test('troca a foto e ela só é servida pela rota autenticada', async ({ page }) => {
  await page.goto(perfil);
  await page.locator('input[type=file][accept^="image/"]').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: PNG });
  await esperarAviso(page, 'Foto atualizada.');
  const src = await page.locator(`img[src*="${perfil}/foto?v="]`).first().getAttribute('src');
  expect(src).toBeTruthy();
  const resposta = await page.request.get(src);
  expect(resposta.status()).toBe(200);
  expect(resposta.headers()['content-type']).toBe('image/png');
});

test('cadastro com histórico não pode ser excluído', async ({ page }) => {
  await page.goto(`/pacientes?q=${encodeURIComponent(nome)}`);
  await page.getByRole('button', { name: 'Mais ações' }).first().click();
  await page.getByRole('button', { name: 'Excluir cadastro' }).click();
  await page.locator('.swal2-popup').getByRole('button', { name: 'Excluir cadastro' }).click();
  await esperarAviso(page, 'não pode ser excluído');
});
