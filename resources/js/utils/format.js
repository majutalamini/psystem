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
