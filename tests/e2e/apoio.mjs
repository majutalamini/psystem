import { expect } from '@playwright/test';

// Login de desenvolvimento criado pelo DatabaseSeeder no banco isolado psystem_e2e.
export const LOGIN = { email: 'isadora.talamini@psystem.com', senha: 'psystem123' };

export async function entrar(page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(LOGIN.email);
  await page.getByLabel('Senha', { exact: true }).fill(LOGIN.senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Confirma o diálogo do SweetAlert pelo texto do botão. */
export async function confirmarDialogo(page, botao) {
  const dialogo = page.locator('.swal2-popup');
  await expect(dialogo).toBeVisible();
  await dialogo.getByRole('button', { name: botao, exact: true }).click();
}

/** Espera o aviso de sucesso (toast) ou o diálogo de erro e devolve o texto. */
export async function aviso(page) {
  const popup = page.locator('.swal2-popup').last();
  await expect(popup).toBeVisible();
  return (await popup.innerText()).trim();
}

/** Espera um aviso (toast ou diálogo) com o texto; ignora avisos anteriores ainda na tela. */
export async function esperarAviso(page, texto) {
  await expect(page.locator('.swal2-popup').filter({ hasText: texto }).first()).toBeVisible();
}

/** Fecha avisos que ficaram abertos (erro com botão "Entendi"). */
export async function fecharAviso(page) {
  const entendi = page.locator('.swal2-popup').getByRole('button', { name: 'Entendi' });
  if (await entendi.isVisible().catch(() => false)) await entendi.click();
}

/** Dados sintéticos únicos por execução (nunca dados reais). */
export function sufixo() {
  return Date.now().toString().slice(-6);
}

/** CPF sintético válido a partir de 9 dígitos. */
export function cpfValido(base9) {
  const d = base9.split('').map(Number);
  const dv = (nums, peso) => {
    const soma = nums.reduce((s, n, i) => s + n * (peso - i), 0);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = dv(d, 10);
  const d2 = dv([...d, d1], 11);
  return [...d, d1, d2].join('');
}
