/* As cores são variáveis CSS (css/theme.css) para o tema claro/escuro trocar sem recarregar. */
export const T = {
  bg: "var(--c-bg)",
  surface: "var(--c-surface)",
  surfaceAlt: "var(--c-surface-alt)",
  hover: "var(--c-hover)",
  mutedBg: "var(--c-muted-bg)",
  border: "var(--c-border)",
  track: "var(--c-track)",
  faint: "var(--c-faint)",
  text: "var(--c-text)",
  muted: "var(--c-muted)",
  primary: "var(--c-primary)",
  primaryDark: "var(--c-primary-dark)",
  primaryHover: "var(--c-primary-hover)",
  primaryTint: "var(--c-primary-tint)",
  success: "var(--c-success)",
  successTint: "var(--c-success-tint)",
  danger: "var(--c-danger)",
  dangerTint: "var(--c-danger-tint)",
  warn: "var(--c-warn)",
  warnTint: "var(--c-warn-tint)",
  warnText: "var(--c-warn-text)",
};

/* Fonte de exibição — usada na marca, na navegação lateral e nos títulos. */
export const FONT_DISPLAY = "'Outfit', 'Plus Jakarta Sans', sans-serif";

const ev = (n) => ({ bg: `var(--ev-${n}-bg)`, border: `var(--ev-${n}-border)`, text: `var(--ev-${n}-text)` });
export const EVENT_STYLES = {
  purple: ev("purple"),
  yellow: ev("yellow"),
  pink: ev("pink"),
  green: ev("green"),
  teal: ev("teal"),
  gray: ev("gray"),
};

export const COLOR_PALETTE = ["purple", "yellow", "pink", "green", "teal"];

export const WA_GREEN = "#25D366";

export const WA_GREEN_DARK = "#1EBE5B";
