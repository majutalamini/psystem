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

export function weekdayIndex(offset) {
  return ((offset % 7) + 7) % 7; // 0 = Monday, since offset 0 (baseDate) is a Monday
}
