import { parseBrDate } from "./date";

/* Soma dias a uma data "dd/mm/aaaa" e devolve no mesmo formato. */
export function addDaysBr(str, dias) {
  const d = parseBrDate(str);
  if (!d) return str;
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString("pt-BR");
}
