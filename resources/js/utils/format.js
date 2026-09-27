export function initialsFromName(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function firstName(name) {
  return String(name || "").trim().split(" ")[0] || "";
}

export function onlyDigits(v) {
  return String(v || "").replace(/\D/g, "");
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function statusTone(status) {
  if (status === "Pago") return "success";
  if (status === "Pendente") return "warn";
  return "danger"; // Atrasado
}

export function sessionStatusTone(status) {
  if (status === "Realizada") return "success";
  if (status === "Agendada") return "primary";
  if (status === "Falta") return "danger";
  return "warn"; // Cancelada
}

/* Campo de valor em reais: deixa só dígitos e uma vírgula com até 2 casas ("150,50"). Ponto vira vírgula. */
export function sanitizeMoney(texto) {
  const [inteiro, ...resto] = String(texto ?? "").replace(/\./g, ",").replace(/[^\d,]/g, "").split(",");
  return resto.length ? `${inteiro},${resto.join("").slice(0, 2)}` : inteiro;
}

/* "150,50" → 150.5; vazio ou inválido → null. */
export function parseMoney(texto) {
  const s = String(texto ?? "").trim();
  if (!/^\d+(,\d{1,2})?$/.test(s)) return null;
  return Number(s.replace(",", "."));
}

export function formatMoney(valor) {
  return Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
