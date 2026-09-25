import { CalendarClock, CircleDollarSign, ClipboardList, Clock, FileText, HeartPulse, Users2, Wallet } from "lucide-react";
import { EVENT_STYLES, T } from "../styles/theme";

export const MONTHS_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export const AGE_BUCKETS = [
  { label: "0–17", test: (a) => a <= 17 },
  { label: "18–25", test: (a) => a >= 18 && a <= 25 },
  { label: "26–35", test: (a) => a >= 26 && a <= 35 },
  { label: "36–45", test: (a) => a >= 36 && a <= 45 },
  { label: "46–60", test: (a) => a >= 46 && a <= 60 },
  { label: "60+", test: (a) => a > 60 },
];

export const REPORT_CATEGORIES = [
  {
    key: "pacientes", label: "Pacientes", icon: ClipboardList, badgeIcon: Users2,
    accent: T.primary, accentTint: T.primaryTint,
    subtitle: "Relatórios completos sobre seus pacientes e atendimentos.",
    reports: [
      { key: "lista", label: "Lista de pacientes", desc: "Todos os pacientes, com convênio, sessões e situação." },
      { key: "aniversariantes", label: "Aniversariantes do mês", desc: "Pacientes que fazem aniversário no mês selecionado." },
      { key: "inativos", label: "Inativos / risco de abandono", desc: "Pacientes inativos ou sem sessão recente." },
      { key: "novos", label: "Novos cadastros no período", desc: "Pacientes cadastrados dentro do intervalo escolhido." },
      { key: "faixa-etaria", label: "Faixa etária", desc: "Distribuição dos pacientes por idade." },
      { key: "genero", label: "Gênero", desc: "Distribuição dos pacientes por gênero." },
    ],
  },
  {
    key: "agenda", label: "Agenda", icon: CalendarClock, badgeIcon: Clock,
    accent: EVENT_STYLES.purple.text, accentTint: EVENT_STYLES.purple.bg,
    subtitle: "Visualize sua agenda, faltas, remarcações e horários.",
    reports: [
      { key: "realizadas-agendadas", label: "Sessões realizadas vs. agendadas", desc: "Comparativo de sessões no período selecionado." },
      { key: "faltas-cancelamentos", label: "Faltas e cancelamentos", desc: "Faltas e cancelamentos por paciente ou por período." },
      { key: "frequencia", label: "Frequência de sessões por paciente", desc: "Quantas sessões cada paciente fez e o intervalo médio entre elas." },
      { key: "ocupacao", label: "Ocupação da agenda", desc: "Horários livres x preenchidos por dia." },
    ],
  },
  {
    key: "financeiro", label: "Financeiro", icon: CircleDollarSign, badgeIcon: Wallet,
    accent: T.success, accentTint: T.successTint,
    subtitle: "Relatórios financeiros, recebimentos, inadimplências e faturamento.",
    reports: [
      { key: "receber", label: "Contas a receber", desc: "Mensalidades e cobranças pagas ou em aberto." },
      { key: "pagar", label: "Contas a pagar", desc: "Despesas do consultório." },
      { key: "inadimplencia", label: "Inadimplência", desc: "Cobranças vencidas e ainda não pagas." },
      { key: "recebimento-paciente", label: "Recebimento por paciente", desc: "Total recebido por paciente, pesquisável por nome." },
    ],
  },
  {
    key: "clinico", label: "Clínico", icon: HeartPulse, badgeIcon: FileText,
    accent: EVENT_STYLES.teal.text, accentTint: EVENT_STYLES.teal.bg,
    subtitle: "Acompanhe a documentação clínica dos seus pacientes.",
    reports: [
      { key: "com-anamnese", label: "Pacientes com anamnese", desc: "Pacientes que já têm anamnese preenchida." },
      { key: "sem-anamnese", label: "Pacientes sem anamnese", desc: "Pacientes que ainda não têm anamnese preenchida." },
      { key: "com-prontuario", label: "Pacientes com prontuários", desc: "Pacientes com registros no prontuário." },
      { key: "sem-prontuario", label: "Pacientes sem prontuários", desc: "Pacientes sem nenhum registro no prontuário." },
    ],
  },
];
