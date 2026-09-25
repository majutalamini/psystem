import { WA_SAMPLE } from "../data/whatsapp";
import { firstName, onlyDigits } from "./format";

/* Normaliza para o formato aceito pelo wa.me (DDI + DDD + número). */
export function waNumber(phone) {
  const d = onlyDigits(phone);
  if (!d) return "";
  return d.startsWith("55") ? d : `55${d}`;
}

export function openWhatsapp(phone, text) {
  const n = waNumber(phone);
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  window.open(n ? `https://wa.me/${n}${query}` : `https://wa.me/${query}`, "_blank", "noopener");
}

/* Substitui as variáveis do modelo pelos dados reais do paciente. */
export function fillWaVars(template, patient, receivable) {
  if (!template) return "";
  const values = {
    "{paciente}": firstName(patient && patient.name),
    "{data}": patient && patient.nextSession && patient.nextSession !== "—" ? patient.nextSession : "a definir",
    "{hora}": patient && patient.matricula ? patient.matricula.time : "09:00",
    "{ultimaSessao}": (patient && patient.lastSession) || "—",
    "{referencia}": receivable ? receivable.referencia : "das sessões",
    "{valor}": receivable ? `R$ ${receivable.valor.toLocaleString("pt-BR")}` : "—",
    "{vencimento}": receivable ? receivable.vencimento : "—",
  };
  return Object.keys(values).reduce((acc, k) => acc.split(k).join(values[k]), template);
}

export function fillWaSample(text) {
  return Object.keys(WA_SAMPLE).reduce((acc, k) => acc.split(k).join(WA_SAMPLE[k]), text || "");
}
