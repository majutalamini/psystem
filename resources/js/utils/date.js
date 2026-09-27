const now = new Date();
export const TODAY = new Date(now.getFullYear(), now.getMonth(), now.getDate());

export function todayLabel() {
  return TODAY.toLocaleDateString("pt-BR");
}

export function parseBrDate(str) {
  if (!str) return null;
  const [d, m, y] = str.split("/").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

export function ageFromBrDate(str, ref = TODAY) {
  const d = parseBrDate(str);
  if (!d) return null;
  let age = ref.getFullYear() - d.getFullYear();
  const monthDiff = ref.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < d.getDate())) age--;
  return age;
}

export function daysBetweenBr(fromStr, toStr = null) {
  const from = parseBrDate(fromStr);
  const to = toStr ? parseBrDate(toStr) : TODAY;
  if (!from || !to) return null;
  return Math.round((to - from) / 86400000);
}

export function mostRecentBrDate(dates) {
  const parsed = dates.map(parseBrDate).filter(Boolean);
  if (!parsed.length) return null;
  return new Date(Math.max(...parsed.map((d) => d.getTime())));
}


/* Datas "AAAA-MM-DD" vindas do servidor, lidas no fuso local (new Date("AAAA-MM-DD") seria UTC). */
export function parseIsoDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toIsoDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDaysIso(str, days) {
  const d = parseIsoDate(str);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

/* Período padrão dos relatórios: do 1º dia de `monthsBack` meses atrás até o fim do mês atual. */
export function monthRangeBr(monthsBack) {
  const from = new Date(TODAY.getFullYear(), TODAY.getMonth() - monthsBack, 1);
  const to = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0);
  return { from: from.toLocaleDateString("pt-BR"), to: to.toLocaleDateString("pt-BR") };
}

/* O horário "HH:MM" do dia "AAAA-MM-DD" já passou? (Sem fuso no texto, o Date lê no horário local.) */
export function isPastSlot(isoDate, hora) {
  return new Date(`${isoDate}T${hora}`) <= new Date();
}
