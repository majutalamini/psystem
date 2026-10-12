const KEY = "psystem-tema";

export function temaAtual() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function aplicarTema(tema) {
  document.documentElement.dataset.theme = tema;
  try { localStorage.setItem(KEY, tema); } catch { /* sem armazenamento: vale só nesta sessão */ }
}

export function alternarTema() {
  const novo = temaAtual() === "dark" ? "light" : "dark";
  aplicarTema(novo);
  return novo;
}
