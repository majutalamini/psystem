import { CalendarClock, Check, CircleDollarSign, Eye, FileCheck2, FileSignature, Image as ImageIcon, Receipt } from "lucide-react";
import { EVENT_STYLES, T } from "../styles/theme";
import { formatMoney } from "../utils/format";

/* Modelos de declarações. build(paciente, valores, data, psicóloga logada); default pode ser função do paciente.
   type "money": campo em reais; chega no build já como número. */
export const DECLARATION_TEMPLATES = [
  {
    id: "atestado",
    title: "Atestado de comparecimento",
    desc: "Comprova a presença do paciente na sessão em data e horário específicos.",
    icon: FileCheck2, badgeIcon: Check,
    accent: T.primary, accentTint: T.primaryTint,
    fields: [
      { key: "horario", label: "Horário da sessão", type: "text", default: "09:00" },
      { key: "duracao", label: "Duração", type: "text", default: "50 minutos" },
    ],
    build: (p, v, date) => [
      `Atesto, para os devidos fins, que ${p.name} esteve presente em atendimento psicológico realizado em ${date}, no horário das ${v.horario}, com duração de ${v.duracao}.`,
    ],
  },
  {
    id: "acompanhamento",
    title: "Declaração de acompanhamento psicológico",
    desc: "Declara que o paciente está em processo terapêutico regular.",
    icon: FileSignature, badgeIcon: CalendarClock,
    accent: EVENT_STYLES.purple.text, accentTint: EVENT_STYLES.purple.bg,
    fields: [
      { key: "desde", label: "Em acompanhamento desde", type: "text", default: (p) => (p.matricula && p.matricula.inicio) || p.cadastro || "" },
      { key: "frequencia", label: "Frequência", type: "select", options: ["Semanal", "Quinzenal", "Mensal"], default: "Semanal" },
    ],
    build: (p, v, date) => [
      `Declaro, para os devidos fins, que ${p.name} encontra-se em acompanhamento psicológico sob minha responsabilidade técnica desde ${v.desde}, com frequência ${v.frequencia.toLowerCase()}.`,
      `A presente declaração é emitida em ${date} a pedido do(a) interessado(a).`,
    ],
  },
  {
    id: "imagem",
    title: "Declaração de uso de imagem",
    desc: "Autorização do paciente para uso de imagem e depoimentos.",
    icon: ImageIcon, badgeIcon: Eye,
    accent: T.success, accentTint: T.successTint,
    fields: [
      { key: "finalidade", label: "Finalidade do uso", type: "text", default: "divulgação em redes sociais e site do consultório" },
    ],
    build: (p, v, date, psi) => [
      `Eu, ${p.name}, autorizo o uso da minha imagem e/ou depoimento por ${psi.nome}, para fins de ${v.finalidade}, sem qualquer ônus, a partir de ${date}.`,
      `Esta autorização pode ser revogada a qualquer momento mediante solicitação por escrito.`,
    ],
  },
  {
    id: "recibo",
    title: "Recibo de pagamento",
    desc: "Recibo referente a sessões de psicoterapia realizadas.",
    icon: Receipt, badgeIcon: CircleDollarSign,
    accent: "#8A6413", accentTint: T.warnTint,
    fields: [
      { key: "valor", label: "Valor recebido (R$)", type: "money", default: (p) => (p.matricula ? p.matricula.valor : "") },
      { key: "forma", label: "Forma de pagamento", type: "select", options: ["Pix", "Cartão", "Dinheiro"], default: "Pix" },
      { key: "referente", label: "Referente a", type: "text", default: "sessão de psicoterapia" },
    ],
    build: (p, v, date) => [
      `Recebi de ${p.name} a quantia de R$ ${formatMoney(v.valor)}, via ${v.forma}, referente a ${v.referente}, em ${date}.`,
    ],
  },
];
