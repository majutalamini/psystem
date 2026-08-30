import React, { useState, useMemo, useRef, useEffect, createContext, useContext } from "react";
import {
  LayoutDashboard, CalendarDays, Users, FileText, BarChart3, Wallet, Settings,
  Bell, Search, Plus, ChevronLeft, ChevronRight, Clock, Phone, Mail, X, Check,
  TrendingUp, TrendingDown, MoreVertical, Brain, MapPin, Video, Edit3,
  Trash2, ChevronDown, CalendarClock, CircleDollarSign, Users2, Star,
  ArrowDownCircle, ArrowUpCircle, UploadCloud, FileSignature, FileCheck2,
  Image as ImageIcon, Receipt, Landmark, Printer, Copy, Eye, RefreshCw,
  ArrowLeft, ClipboardList, HeartPulse, User, Home, ShieldCheck, Cake, CreditCard,
  ExternalLink, Paperclip, SlidersHorizontal, Download
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const T = {
  bg: "#F5F7FC",
  surface: "#FFFFFF",
  border: "#E8EBF3",
  text: "#1C2233",
  muted: "#8A93AC",
  primary: "#4C6FFF",
  primaryDark: "#3853D6",
  primaryTint: "#EAEFFF",
  success: "#1FAE6E",
  successTint: "#E7F8EF",
  danger: "#E5484D",
  dangerTint: "#FDECEC",
  warn: "#F0A93A",
  warnTint: "#FDF2E1",
};

const EVENT_STYLES = {
  purple: { bg: "#F1E8FC", border: "#D9C4F5", text: "#6E3FA8" },
  yellow: { bg: "#FCF3D6", border: "#F0DFA0", text: "#8A6A0B" },
  pink: { bg: "#FCE1E5", border: "#F4C0C8", text: "#B23A50" },
  green: { bg: "#E3F4E1", border: "#C4E7C0", text: "#2E7D34" },
  teal: { bg: "#DAF2EF", border: "#B9E4DE", text: "#1E7A70" },
  gray: { bg: "#474C58", border: "#474C58", text: "#FFFFFF" },
};

/* ------------------------------------------------------------------ */
/* Mock data                                                            */
/* ------------------------------------------------------------------ */
const COLOR_PALETTE = ["purple", "yellow", "pink", "green", "teal"];

const initialPatients = [
  { id: 1, name: "Maria Aparecida", initials: "MA", phone: "(48) 99123-4501", email: "maria.aparecida@email.com", status: "Ativo", sessions: 24, lastSession: "12/08/2026", nextSession: "19/08/2026", color: "purple", note: "Trabalhando estratégias de regulação emocional; boa adesão às tarefas de casa.", cpf: "123.456.789-01", nascimento: "14/03/1990", genero: "Feminino", cadastro: "10/01/2025", endereco: "Rua das Palmeiras, 210 — Centro, Criciúma/SC", convenio: "Particular", emergenciaNome: "José Aparecida (esposo)", emergenciaTelefone: "(48) 99900-1111", observacoes: "", matricula: { weekday: 0, time: "08:00", tipo: "Consulta presencial" } },
  { id: 2, name: "Pedro Silva", initials: "PS", phone: "(48) 99123-4502", email: "pedro.silva@email.com", status: "Ativo", sessions: 8, lastSession: "10/08/2026", nextSession: "17/08/2026", color: "yellow", note: "Início de processo para ansiedade generalizada; relatou melhora no sono.", cpf: "234.567.890-12", nascimento: "22/07/1988", genero: "Masculino", cadastro: "15/05/2026", endereco: "Av. Centenário, 1450 — Pio Corrêa, Criciúma/SC", convenio: "Unimed", emergenciaNome: "Ana Silva (irmã)", emergenciaTelefone: "(48) 99900-2222", observacoes: "" },
  { id: 3, name: "Jorge Sousa", initials: "JS", phone: "(48) 99123-4503", email: "jorge.sousa@email.com", status: "Ativo", sessions: 15, lastSession: "09/08/2026", nextSession: "17/08/2026", color: "pink", note: "Foco em questões de carreira e autoestima; retomar plano de ação na próxima sessão.", cpf: "345.678.901-23", nascimento: "05/11/1995", genero: "Masculino", cadastro: "02/03/2026", endereco: "Rua Coronel Pedro Benedet, 88 — Centro, Criciúma/SC", convenio: "Particular", emergenciaNome: "Marta Sousa (mãe)", emergenciaTelefone: "(48) 99900-3333", observacoes: "" },
  { id: 4, name: "Patrícia Alves", initials: "PA", phone: "(48) 99123-4504", email: "patricia.alves@email.com", status: "Ativo", sessions: 32, lastSession: "11/08/2026", nextSession: "17/08/2026", color: "green", note: "Acompanhamento de luto; evolução consistente, reduzir para frequência quinzenal.", cpf: "456.789.012-34", nascimento: "30/01/1979", genero: "Feminino", cadastro: "20/11/2024", endereco: "Rua Marechal Deodoro, 675 — Centro, Criciúma/SC", convenio: "Bradesco Saúde", emergenciaNome: "Carlos Alves (filho)", emergenciaTelefone: "(48) 99900-4444", observacoes: "" },
  { id: 5, name: "Luísa Silva", initials: "LS", phone: "(48) 99123-4505", email: "luisa.silva@email.com", status: "Inativo", sessions: 6, lastSession: "22/06/2026", nextSession: "—", color: "teal", note: "Pausa solicitada pela paciente por motivos de agenda; retorno previsto em setembro.", cpf: "567.890.123-45", nascimento: "18/09/1992", genero: "Feminino", cadastro: "14/02/2026", endereco: "Rua Henrique Lage, 320 — Próspera, Criciúma/SC", convenio: "Particular", emergenciaNome: "Beatriz Silva (mãe)", emergenciaTelefone: "(48) 99900-5555", observacoes: "" },
  { id: 6, name: "Mike Pereira", initials: "MP", phone: "(48) 99123-4506", email: "mike.pereira@email.com", status: "Ativo", sessions: 3, lastSession: "14/08/2026", nextSession: "17/08/2026", color: "purple", note: "Sessões iniciais de anamnese; construção de vínculo terapêutico em andamento.", cpf: "678.901.234-56", nascimento: "02/08/2000", genero: "Masculino", cadastro: "05/08/2026", endereco: "Rua Fernando Machado, 55 — Centro, Criciúma/SC", convenio: "SulAmérica", emergenciaNome: "Sandra Pereira (mãe)", emergenciaTelefone: "(48) 99900-6666", observacoes: "" },
  { id: 7, name: "Ana Carolina Santos", initials: "AC", phone: "(48) 99123-4507", email: "ana.carolina@email.com", status: "Ativo", sessions: 41, lastSession: "17/08/2026", nextSession: "24/08/2026", color: "green", note: "Terapia de longo prazo para TOC; manutenção com bons resultados.", cpf: "789.012.345-67", nascimento: "27/12/1985", genero: "Feminino", cadastro: "18/06/2024", endereco: "Rua Gustavo Richard, 140 — Centro, Criciúma/SC", convenio: "Particular", emergenciaNome: "Rafael Santos (esposo)", emergenciaTelefone: "(48) 99900-7777", observacoes: "" },
  { id: 8, name: "João Silva", initials: "JS", phone: "(48) 99123-4508", email: "joao.silva@email.com", status: "Ativo", sessions: 12, lastSession: "17/08/2026", nextSession: "24/08/2026", color: "yellow", note: "Consulta online; trabalhando comunicação assertiva no ambiente de trabalho.", cpf: "890.123.456-78", nascimento: "09/06/1993", genero: "Masculino", cadastro: "22/04/2026", endereco: "Rua Desembargador Pedro Silva, 402 — Centro, Criciúma/SC", convenio: "Amil", emergenciaNome: "Renata Silva (esposa)", emergenciaTelefone: "(48) 99900-8888", observacoes: "" },
  { id: 9, name: "Maria Cardoso", initials: "MC", phone: "(48) 99123-4509", email: "maria.cardoso@email.com", status: "Inativo", sessions: 19, lastSession: "30/05/2026", nextSession: "—", color: "pink", note: "Encerramento de processo terapêutico por alta; acompanhamento concluído com êxito.", cpf: "901.234.567-89", nascimento: "11/02/1983", genero: "Feminino", cadastro: "10/09/2025", endereco: "Rua Felipe Schmidt, 96 — Centro, Criciúma/SC", convenio: "Particular", emergenciaNome: "Paulo Cardoso (esposo)", emergenciaTelefone: "(48) 99900-9999", observacoes: "" },
];

const revenueData = [
  { month: "Mar", value: 6.0 },
  { month: "Abr", value: 7.0 },
  { month: "Mai", value: 8.3 },
  { month: "Jun", value: 7.0 },
  { month: "Jul", value: 9.0 },
  { month: "Ago", value: 10.4, current: true },
];

const todayAppointments = [
  { time: "09:00", name: "Maria Aparecida", type: "Consulta presencial" },
  { time: "10:00", name: "Pedro Silva", type: "Consulta online" },
  { time: "11:00", name: "Jorge Sousa", type: "Consulta presencial" },
  { time: "13:00", name: "Patrícia Alves", type: "Consulta presencial" },
  { time: "14:00", name: "Luísa Silva", type: "Consulta online" },
  { time: "15:00", name: "Mike Pereira", type: "Consulta presencial" },
];

const weekSchedules = {
  0: [
    { time: "08:00", name: "Ana Carolina Santos", type: "Consulta presencial", color: "purple", status: "Confirmado" },
    { time: "09:00", name: "João Silva", type: "Consulta online", color: "yellow", status: "Pendente" },
    { time: "10:00", name: "Maria Cardoso", type: "Consulta presencial", color: "pink", status: "Confirmado" },
    { time: "11:00", name: "Intervalo", type: "", color: "gray", isBreak: true },
    { time: "13:00", name: "Ana Carolina Santos", type: "Consulta presencial", color: "green", status: "Confirmado" },
    { time: "15:00", name: "Ana Carolina Santos", type: "Consulta presencial", color: "teal", status: "Confirmado" },
  ],
  1: [
    { time: "09:00", name: "Maria Aparecida", type: "Consulta presencial", color: "purple", status: "Confirmado" },
    { time: "10:00", name: "Pedro Silva", type: "Consulta online", color: "yellow", status: "Pendente" },
    { time: "11:00", name: "Intervalo", type: "", color: "gray", isBreak: true },
    { time: "14:00", name: "Mike Pereira", type: "Consulta presencial", color: "teal", status: "Confirmado" },
  ],
  "-1": [
    { time: "08:00", name: "Jorge Sousa", type: "Consulta presencial", color: "pink", status: "Confirmado" },
    { time: "11:00", name: "Intervalo", type: "", color: "gray", isBreak: true },
    { time: "13:00", name: "Patrícia Alves", type: "Consulta presencial", color: "green", status: "Confirmado" },
    { time: "14:00", name: "Luísa Silva", type: "Consulta online", color: "purple", status: "Pendente" },
  ],
};

const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];

/* Histórico de sessões (base para os relatórios de agenda) */
const initialSessions = [
  { id: 1, paciente: "Maria Aparecida", data: "01/07/2026", status: "Realizada" },
  { id: 2, paciente: "Maria Aparecida", data: "08/07/2026", status: "Realizada" },
  { id: 3, paciente: "Maria Aparecida", data: "15/07/2026", status: "Falta" },
  { id: 4, paciente: "Maria Aparecida", data: "22/07/2026", status: "Realizada" },
  { id: 5, paciente: "Maria Aparecida", data: "29/07/2026", status: "Realizada" },
  { id: 6, paciente: "Maria Aparecida", data: "05/08/2026", status: "Realizada" },
  { id: 7, paciente: "Maria Aparecida", data: "12/08/2026", status: "Realizada" },
  { id: 8, paciente: "Maria Aparecida", data: "19/08/2026", status: "Agendada" },

  { id: 9, paciente: "Pedro Silva", data: "15/06/2026", status: "Realizada" },
  { id: 10, paciente: "Pedro Silva", data: "22/06/2026", status: "Realizada" },
  { id: 11, paciente: "Pedro Silva", data: "29/06/2026", status: "Cancelada" },
  { id: 12, paciente: "Pedro Silva", data: "06/07/2026", status: "Realizada" },
  { id: 13, paciente: "Pedro Silva", data: "13/07/2026", status: "Realizada" },
  { id: 14, paciente: "Pedro Silva", data: "20/07/2026", status: "Realizada" },
  { id: 15, paciente: "Pedro Silva", data: "27/07/2026", status: "Falta" },
  { id: 16, paciente: "Pedro Silva", data: "03/08/2026", status: "Realizada" },
  { id: 17, paciente: "Pedro Silva", data: "10/08/2026", status: "Realizada" },
  { id: 18, paciente: "Pedro Silva", data: "17/08/2026", status: "Agendada" },

  { id: 19, paciente: "Jorge Sousa", data: "12/07/2026", status: "Realizada" },
  { id: 20, paciente: "Jorge Sousa", data: "19/07/2026", status: "Realizada" },
  { id: 21, paciente: "Jorge Sousa", data: "26/07/2026", status: "Realizada" },
  { id: 22, paciente: "Jorge Sousa", data: "02/08/2026", status: "Realizada" },
  { id: 23, paciente: "Jorge Sousa", data: "09/08/2026", status: "Realizada" },
  { id: 24, paciente: "Jorge Sousa", data: "17/08/2026", status: "Agendada" },

  { id: 25, paciente: "Patrícia Alves", data: "14/07/2026", status: "Realizada" },
  { id: 26, paciente: "Patrícia Alves", data: "21/07/2026", status: "Realizada" },
  { id: 27, paciente: "Patrícia Alves", data: "28/07/2026", status: "Falta" },
  { id: 28, paciente: "Patrícia Alves", data: "04/08/2026", status: "Realizada" },
  { id: 29, paciente: "Patrícia Alves", data: "11/08/2026", status: "Realizada" },
  { id: 30, paciente: "Patrícia Alves", data: "17/08/2026", status: "Agendada" },

  { id: 31, paciente: "Ana Carolina Santos", data: "20/07/2026", status: "Realizada" },
  { id: 32, paciente: "Ana Carolina Santos", data: "27/07/2026", status: "Realizada" },
  { id: 33, paciente: "Ana Carolina Santos", data: "03/08/2026", status: "Realizada" },
  { id: 34, paciente: "Ana Carolina Santos", data: "10/08/2026", status: "Realizada" },
  { id: 35, paciente: "Ana Carolina Santos", data: "17/08/2026", status: "Realizada" },
  { id: 36, paciente: "Ana Carolina Santos", data: "24/08/2026", status: "Agendada" },

  { id: 37, paciente: "João Silva", data: "22/07/2026", status: "Realizada" },
  { id: 38, paciente: "João Silva", data: "29/07/2026", status: "Cancelada" },
  { id: 39, paciente: "João Silva", data: "05/08/2026", status: "Realizada" },
  { id: 40, paciente: "João Silva", data: "17/08/2026", status: "Realizada" },
  { id: 41, paciente: "João Silva", data: "24/08/2026", status: "Agendada" },

  { id: 42, paciente: "Luísa Silva", data: "08/06/2026", status: "Realizada" },
  { id: 43, paciente: "Luísa Silva", data: "15/06/2026", status: "Realizada" },
  { id: 44, paciente: "Luísa Silva", data: "22/06/2026", status: "Realizada" },

  { id: 45, paciente: "Mike Pereira", data: "31/07/2026", status: "Realizada" },
  { id: 46, paciente: "Mike Pereira", data: "07/08/2026", status: "Realizada" },
  { id: 47, paciente: "Mike Pereira", data: "14/08/2026", status: "Realizada" },
  { id: 48, paciente: "Mike Pereira", data: "17/08/2026", status: "Agendada" },

  { id: 49, paciente: "Maria Cardoso", data: "16/05/2026", status: "Realizada" },
  { id: 50, paciente: "Maria Cardoso", data: "23/05/2026", status: "Realizada" },
  { id: 51, paciente: "Maria Cardoso", data: "30/05/2026", status: "Realizada" },
];

/* Contas a receber (mensalidades dos pacientes) */
const initialReceivables = [
  { id: 1, paciente: "Maria Aparecida", referencia: "Mensalidade — Agosto/2026", valor: 800, vencimento: "05/08/2026", status: "Pago" },
  { id: 2, paciente: "Pedro Silva", referencia: "Mensalidade — Agosto/2026", valor: 720, vencimento: "05/08/2026", status: "Pago" },
  { id: 3, paciente: "Jorge Sousa", referencia: "Mensalidade — Agosto/2026", valor: 800, vencimento: "10/08/2026", status: "Pendente" },
  { id: 4, paciente: "Patrícia Alves", referencia: "Mensalidade — Agosto/2026", valor: 880, vencimento: "08/08/2026", status: "Pago" },
  { id: 5, paciente: "Luísa Silva", referencia: "Mensalidade — Julho/2026", valor: 600, vencimento: "05/07/2026", status: "Atrasado" },
  { id: 6, paciente: "Mike Pereira", referencia: "Mensalidade — Agosto/2026", valor: 200, vencimento: "20/08/2026", status: "Pendente" },
];

/* Contas a pagar (despesas do consultório) */
const initialPayables = [
  { id: 1, descricao: "Aluguel do consultório", categoria: "Estrutura", valor: 1200, vencimento: "05/08/2026", status: "Pago" },
  { id: 2, descricao: "Assinatura plataforma Psystem", categoria: "Software", valor: 89, vencimento: "16/08/2026", status: "Pago" },
  { id: 3, descricao: "Material de escritório", categoria: "Suprimentos", valor: 65, vencimento: "10/08/2026", status: "Pago" },
  { id: 4, descricao: "Contador", categoria: "Serviços", valor: 350, vencimento: "25/08/2026", status: "Pendente" },
  { id: 5, descricao: "Energia elétrica", categoria: "Estrutura", valor: 180, vencimento: "18/08/2026", status: "Pendente" },
];

const PAYABLE_CATEGORIES = ["Estrutura", "Software", "Suprimentos", "Serviços", "Outros"];

/* Modelos de declarações */
const DECLARATION_TEMPLATES = [
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
      { key: "desde", label: "Em acompanhamento desde", type: "text", default: "10/01/2026" },
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
    build: (p, v, date) => [
      `Eu, ${p.name}, autorizo o uso da minha imagem e/ou depoimento pela Dra. Isadora Talamini, para fins de ${v.finalidade}, sem qualquer ônus, a partir de ${date}.`,
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
      { key: "valor", label: "Valor recebido (R$)", type: "number", default: 200 },
      { key: "forma", label: "Forma de pagamento", type: "select", options: ["Pix", "Cartão", "Dinheiro"], default: "Pix" },
      { key: "referente", label: "Referente a", type: "text", default: "sessão de psicoterapia" },
    ],
    build: (p, v, date) => [
      `Recebi de ${p.name} a quantia de R$ ${Number(v.valor).toLocaleString("pt-BR")}, via ${v.forma}, referente a ${v.referente}, em ${date}.`,
    ],
  },
];

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "agenda", label: "Agenda", icon: CalendarDays },
  { key: "pacientes", label: "Pacientes", icon: Users },
  { key: "prontuarios", label: "Prontuários", icon: FileText },
  { key: "relatorios", label: "Relatórios", icon: BarChart3 },
  { key: "financeiro", label: "Financeiro", icon: Wallet },
  { key: "declaracoes", label: "Declarações", icon: FileSignature },
  { key: "configuracoes", label: "Configurações", icon: Settings },
];

/* ------------------------------------------------------------------ */
/* Shared app data (context)                                           */
/* Single source of truth for patients, prontuários, anamneses and     */
/* contas a receber, so Pacientes / Prontuários / Financeiro / Perfil   */
/* do paciente all stay in sync.                                       */
/* ------------------------------------------------------------------ */
const DataContext = createContext(null);
function useAppData() {
  return useContext(DataContext);
}

function DataProvider({ children }) {
  const [patients, setPatients] = useState(initialPatients);
  const [records, setRecords] = useState(() =>
    Object.fromEntries(initialPatients.map((p) => [p.id, [{
      id: 1,
      date: p.lastSession,
      sessao: `Sessão ${p.sessions}`,
      tecnicas: "Escuta ativa, reestruturação cognitiva",
      objetivo: "Continuidade do acompanhamento terapêutico",
      descricao: p.note,
    }]]))
  );
  const [anamneses, setAnamneses] = useState({});
  const [documents, setDocuments] = useState({});
  const [receivables, setReceivables] = useState(initialReceivables);
  const [goals, setGoals] = useState({
    faturamentoMensal: 10000,
    sessoesSemanais: 35,
    horasSemanais: 20,
    novosPacientesMes: 5,
  });

  function updateGoals(changes) {
    setGoals((prev) => ({ ...prev, ...changes }));
  }

  function addPatient(newPatient) {
    setPatients((prev) => [newPatient, ...prev]);
    setRecords((prev) => ({ ...prev, [newPatient.id]: [] }));
  }

  function updatePatient(id, changes) {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)));
  }

  function saveRecord(patientId, entry) {
    setRecords((prev) => {
      const list = prev[patientId] || [];
      const idx = list.findIndex((r) => r.id === entry.id);
      const nextList = idx >= 0
        ? list.map((r, i) => (i === idx ? entry : r))
        : [entry, ...list];
      return { ...prev, [patientId]: nextList };
    });
  }

  function saveAnamnese(patientId, entry) {
    setAnamneses((prev) => {
      const list = prev[patientId] || [];
      const idx = list.findIndex((a) => a.id === entry.id);
      const nextList = idx >= 0
        ? list.map((a, i) => (i === idx ? entry : a))
        : [entry, ...list];
      return { ...prev, [patientId]: nextList };
    });
  }

  function addReceivable(entry) {
    setReceivables((prev) => [{ id: Date.now(), ...entry }, ...prev]);
  }

  function addDocument(patientId, entry) {
    setDocuments((prev) => ({ ...prev, [patientId]: [entry, ...(prev[patientId] || [])] }));
  }

  function removeDocument(patientId, id) {
    setDocuments((prev) => ({ ...prev, [patientId]: (prev[patientId] || []).filter((d) => d.id !== id) }));
  }

  const value = {
    patients, setPatients, addPatient, updatePatient,
    records, saveRecord,
    anamneses, saveAnamnese,
    documents, addDocument, removeDocument,
    receivables, addReceivable,
    goals, updateGoals,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                                */
/* ------------------------------------------------------------------ */
function Avatar({ initials, size = 36, color = "purple" }) {
  const c = EVENT_STYLES[color] || EVENT_STYLES.purple;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: c.bg, color: c.text, border: `1px solid ${c.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: size * 0.36, flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function Card({ children, className = "", style = {} }) {
  return (
    <div
      className={className}
      style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 16, boxShadow: "0 1px 2px rgba(28,34,51,0.03)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Pill({ children, tone = "primary" }) {
  const map = {
    primary: { bg: T.primaryTint, text: T.primaryDark },
    success: { bg: T.successTint, text: T.success },
    danger: { bg: T.dangerTint, text: T.danger },
    warn: { bg: T.warnTint, text: "#8A6413" },
    muted: { bg: "#F1F3F9", text: T.muted },
  };
  const c = map[tone];
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function Switch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 42, height: 24, borderRadius: 999, border: "none", cursor: "pointer",
        background: checked ? T.primary : "#DFE3EE", position: "relative", transition: "background .15s",
        padding: 0, flexShrink: 0,
      }}
      aria-pressed={checked}
    >
      <span
        style={{
          position: "absolute", top: 3, left: checked ? 21 : 3, width: 18, height: 18,
          borderRadius: "50%", background: "#fff", transition: "left .15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        }}
      />
    </button>
  );
}

function Modal({ title, onClose, children, width = 400 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,24,38,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color: T.text, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: T.muted, fontSize: 14, marginTop: 4 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function PrimaryButton({ children, onClick, icon: Icon, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8, background: T.primary, color: "#fff",
        border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 600,
        cursor: "pointer", boxShadow: "0 4px 10px rgba(76,111,255,0.25)", ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.primaryDark)}
      onMouseLeave={(e) => (e.currentTarget.style.background = T.primary)}
    >
      {Icon && <Icon size={19} />}
      {children}
    </button>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 320 }}>
      <Search size={18} color={T.muted} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 12px 10px 40px", borderRadius: 10, border: `1px solid ${T.border}`,
          fontSize: 14, outline: "none", background: T.surface, color: T.text, boxSizing: "border-box",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                              */
/* ------------------------------------------------------------------ */
const headerIconBtn = {
  width: 40, height: 40, borderRadius: "50%", border: "none", cursor: "pointer",
  background: "rgba(255,255,255,0.16)", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};

function Header() {
  return (
    <header style={{ display: "flex", alignItems: "center", gap: 20, background: T.primary, padding: "16px 28px", flexShrink: 0, width: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Brain size={27} color="#fff" />
        </div>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 30, color: "#fff" }}>Psystem</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0, marginLeft: "auto" }}>
        <button style={headerIconBtn}><Bell size={20} /></button>
        <button style={headerIconBtn}><Settings size={20} /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 4 }}>
          <Avatar initials="IT" color="purple" size={42} />
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>Dra. Isadora Talamini</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>Psicóloga</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ page, setPage }) {
  return (
    <aside
      style={{
        width: 268, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column", height: "100%",
      }}
    >
      <nav style={{ flex: 1, padding: "22px 14px 6px", display: "flex", flexDirection: "column", gap: 6 }}>
        {NAV.map((item) => {
          const active = page === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              style={{
                display: "flex", alignItems: "center", gap: 16, padding: "15px 14px 15px 12px",
                borderRadius: 11, borderTopLeftRadius: active ? 0 : 11, borderBottomLeftRadius: active ? 0 : 11,
                border: "none", borderLeft: active ? `4px solid ${T.primary}` : "4px solid transparent",
                cursor: "pointer", fontSize: 16.5, fontWeight: active ? 800 : 600,
                background: active ? T.primaryTint : "transparent", color: active ? T.primaryDark : T.text,
                textAlign: "left", width: "100%", transition: "background .12s, color .12s",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#F5F6FA"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={27} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                            */
/* ------------------------------------------------------------------ */
function StatCard({ label, value, delta, deltaTone = "success", icon: Icon, tone = "primary" }) {
  const toneMap = {
    primary: { bg: T.primaryTint, icon: T.primary },
    success: { bg: T.successTint, icon: T.success },
    warn: { bg: T.warnTint, icon: "#9C7A16" },
    danger: { bg: T.dangerTint, icon: T.danger },
  };
  const c = toneMap[tone] || toneMap.primary;
  return (
    <Card style={{ padding: 18, flex: 1, minWidth: 190 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>{label}</span>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={23} color={c.icon} />
        </div>
      </div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 800, color: T.text }}>{value}</div>
      {delta && (
        <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 600, color: deltaTone === "success" ? T.success : T.danger }}>
          {delta}
        </div>
      )}
    </Card>
  );
}

const WEEK_OVERVIEW = [
  { day: "Seg", count: 6, active: true },
  { day: "Ter", count: 4 },
  { day: "Qua", count: 7 },
  { day: "Qui", count: 5 },
  { day: "Sex", count: 8 },
  { day: "Sáb", count: 2 },
  { day: "Dom", count: 0 },
];

function MiniStat({ label, value, icon: Icon, tone = "primary" }) {
  const toneMap = {
    primary: { bg: T.primaryTint, c: T.primary },
    success: { bg: T.successTint, c: T.success },
    danger: { bg: T.dangerTint, c: T.danger },
  };
  const t = toneMap[tone] || toneMap.primary;
  return (
    <div style={{ background: "#FAFBFE", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
        <div style={{ width: 20, height: 20, borderRadius: 6, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} color={t.c} />
        </div>
        <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{value}</div>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 10,
        border: `1px solid ${T.border}`, background: "#fff", color: T.text, fontWeight: 600, fontSize: 13,
        cursor: "pointer", whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#F5F6FA"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
    >
      <Icon size={18} color={T.primary} />
      {label}
    </button>
  );
}

function WeekOverviewCard({ setPage }) {
  const max = Math.max(...WEEK_OVERVIEW.map((d) => d.count), 1);
  const total = WEEK_OVERVIEW.reduce((s, d) => s + d.count, 0);
  return (
    <Card style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Sua semana</div>
          <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>{total} sessões previstas · semana de 17 a 23/08</div>
        </div>
        <button onClick={() => setPage("agenda")} style={{ background: "none", border: "none", color: T.primary, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
          Ver agenda <ChevronRight size={16} />
        </button>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {WEEK_OVERVIEW.map((d) => (
          <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: "100%", height: 70, background: "#F1F3F9", borderRadius: 8, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
              <div
                style={{
                  width: "100%", height: `${Math.max((d.count / max) * 100, d.count > 0 ? 10 : 0)}%`,
                  background: d.active ? T.primary : T.primaryTint, borderRadius: "8px 8px 0 0", transition: "height .2s",
                }}
              />
            </div>
            <span style={{ fontSize: 12, fontWeight: d.active ? 800 : 600, color: d.active ? T.primary : T.muted }}>{d.day}</span>
            <span style={{ fontSize: 11.5, color: T.muted, marginTop: -6 }}>{d.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PendenciasFinanceirasCard({ setPage }) {
  const { receivables } = useAppData();
  const pendentes = receivables.filter((r) => r.status !== "Pago").slice(0, 4);
  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Pendências financeiras</span>
        <Pill tone="danger">{pendentes.length} em aberto</Pill>
      </div>
      {pendentes.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: T.muted }}>Nenhuma pendência no momento.</div>
      ) : (
        <div>
          {pendentes.map((r, i) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: i < pendentes.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>{r.paciente}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{r.referencia} · vence {r.vencimento}</div>
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>R$ {r.valor.toLocaleString("pt-BR")}</span>
              <Pill tone={statusTone(r.status)}>{r.status}</Pill>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: "12px 20px" }}>
        <button onClick={() => setPage("financeiro")} style={{ background: "none", border: "none", color: T.primary, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
          Ver financeiro completo <ChevronRight size={16} />
        </button>
      </div>
    </Card>
  );
}

function AtencaoPacientesCard({ setPage }) {
  const { patients } = useAppData();
  const attention = patients
    .filter((p) => p.status === "Inativo")
    .map((p) => ({ ...p, reason: "Inativo — sem sessões recentes" }));

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Pacientes que precisam de atenção</span>
        <Pill tone="warn">{attention.length}</Pill>
      </div>
      {attention.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: T.muted }}>Nenhum paciente pendente de retorno.</div>
      ) : (
        <div>
          {attention.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: i < attention.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <Avatar initials={p.initials} color={p.color} size={34} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>{p.name}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{p.reason} · última sessão {p.lastSession}</div>
              </div>
              <button
                onClick={() => setPage("prontuarios")}
                style={{ fontSize: 12.5, fontWeight: 700, color: T.primaryDark, background: T.primaryTint, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}
              >
                Ver prontuário
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: "12px 20px" }}>
        <button onClick={() => setPage("pacientes")} style={{ background: "none", border: "none", color: T.primary, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
          Ver todos os pacientes <ChevronRight size={16} />
        </button>
      </div>
    </Card>
  );
}

function Dashboard({ setPage }) {
  const { patients, goals } = useAppData();
  const financeStats = useMemo(() => {
    const avg = revenueData.reduce((s, d) => s + d.value, 0) / revenueData.length;
    const best = revenueData.reduce((a, b) => (b.value > a.value ? b : a));
    const last = revenueData[revenueData.length - 1];
    const prev = revenueData[revenueData.length - 2];
    const growth = ((last.value - prev.value) / prev.value) * 100;
    return { avg, best, growth };
  }, []);

  const statusData = [
    { name: "Ativos", value: patients.filter((p) => p.status === "Ativo").length },
    { name: "Inativos", value: patients.filter((p) => p.status === "Inativo").length },
  ];
  const statusColors = [T.primary, "#DFE3EE"];
  const sessionsPerMonth = [
    { month: "Mar", sessoes: 30 }, { month: "Abr", sessoes: 34 }, { month: "Mai", sessoes: 39 },
    { month: "Jun", sessoes: 33 }, { month: "Jul", sessoes: 40 }, { month: "Ago", sessoes: 42 },
  ];

  return (
    <div>
      <PageHeader
        title="Olá, Dra. Isadora!"
        subtitle="Aqui está o resumo do seu consultório de hoje, segunda-feira, 17 de agosto."
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <QuickActionButton icon={Plus} label="Novo agendamento" onClick={() => setPage("agenda")} />
            <QuickActionButton icon={Users} label="Novo paciente" onClick={() => setPage("pacientes")} />
            <QuickActionButton icon={FileSignature} label="Gerar declaração" onClick={() => setPage("declaracoes")} />
          </div>
        }
      />

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label="Total de pacientes" value="50" delta="+3 esse mês" icon={Users2} tone="primary" />
        <StatCard label="Sessões hoje" value="10" delta="1 cancelamento" deltaTone="danger" icon={CalendarClock} tone="primary" />
        <StatCard
          label="Faturamento no mês"
          value="R$ 8.200"
          delta={`Meta: R$ ${goals.faturamentoMensal.toLocaleString("pt-BR")}`}
          deltaTone={8200 >= goals.faturamentoMensal ? "success" : "danger"}
          icon={CircleDollarSign}
          tone="success"
        />
        <StatCard
          label="Horas na semana"
          value="18h"
          delta={`Meta: ${goals.horasSemanais}h`}
          deltaTone={18 >= goals.horasSemanais ? "success" : "danger"}
          icon={Clock}
          tone="warn"
        />
      </div>

      <WeekOverviewCard setPage={setPage} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 15, color: T.text }}>
            Próximos agendamentos
          </div>
          <div style={{ flex: 1 }}>
            {todayAppointments.map((a, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
                  borderBottom: i < todayAppointments.length - 1 ? `1px solid ${T.border}` : "none",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: T.primary, width: 42 }}>{a.time}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{a.type}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.border}`, textAlign: "right" }}>
            <button
              onClick={() => setPage("agenda")}
              style={{ background: "none", border: "none", color: T.primary, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: 0 }}
            >
              Ver agenda completa <ChevronRight size={16} />
            </button>
          </div>
        </Card>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 15, color: T.text }}>
            Resumo financeiro do mês
          </div>
          <div style={{ padding: "20px 20px 6px" }}>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={revenueData} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#EEF1F8" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: T.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: T.muted }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(76,111,255,0.06)" }}
                  formatter={(v) => [`R$${v.toFixed(1)}k`, "Faturamento"]}
                  contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13 }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {revenueData.map((d, i) => (
                    <Cell key={i} fill={d.current ? T.primary : T.primaryTint} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ padding: "4px 20px 20px" }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, marginBottom: 14 }}>
              Total no semestre: <span style={{ color: T.primary }}>R$ 47,7k</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
              <MiniStat label="Média mensal" value={`R$ ${financeStats.avg.toFixed(1)}k`} icon={BarChart3} />
              <MiniStat label="Melhor mês" value={financeStats.best.month} icon={Star} />
              <MiniStat
                label="Vs. mês anterior"
                value={`${financeStats.growth >= 0 ? "+" : ""}${financeStats.growth.toFixed(1)}%`}
                icon={financeStats.growth >= 0 ? TrendingUp : TrendingDown}
                tone={financeStats.growth >= 0 ? "success" : "danger"}
              />
            </div>

            <div style={{ textAlign: "right" }}>
              <button
                onClick={() => setPage("financeiro")}
                style={{ background: "none", border: "none", color: T.primary, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: 0 }}
              >
                Ver financeiro completo <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>Sessões por mês</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={sessionsPerMonth} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#EEF1F8" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: T.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: T.muted }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13 }} />
              <Line type="monotone" dataKey="sessoes" stroke={T.primary} strokeWidth={3} dot={{ r: 4, fill: T.primary }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>Pacientes ativos vs. inativos</div>
          <ResponsiveContainer width="100%" height={175}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
                {statusData.map((d, i) => <Cell key={i} fill={statusColors[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 6 }}>
            {statusData.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.muted }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: statusColors[i] }} /> {d.name} ({d.value})
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <PendenciasFinanceirasCard setPage={setPage} />
        <AtencaoPacientesCard setPage={setPage} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Agenda                                                               */
/* ------------------------------------------------------------------ */
function initialsFromName(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function NewAppointmentModal({ onClose, onSave, defaultHour }) {
  const { patients } = useAppData();
  const [form, setForm] = useState({ paciente: patients[0].name, hora: defaultHour || "09:00", tipo: "Consulta presencial", status: "Pendente" });
  return (
    <Modal title="Novo agendamento" onClose={onClose} width={380}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Paciente</label>
      <select value={form.paciente} onChange={(e) => setForm({ ...form, paciente: e.target.value })} style={inputStyle}>
        {patients.map((p) => <option key={p.id}>{p.name}</option>)}
      </select>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Horário</label>
      <select value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} style={inputStyle}>
        {HOURS.map((h) => <option key={h}>{h}</option>)}
      </select>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Tipo de consulta</label>
      <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} style={inputStyle}>
        <option>Consulta presencial</option>
        <option>Consulta online</option>
      </select>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Status</label>
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
        <option>Pendente</option>
        <option>Confirmado</option>
      </select>

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={() => onSave(form)}>Agendar</PrimaryButton>
      </div>
    </Modal>
  );
}

function AppointmentDetailModal({ event, dateLabel, onClose, onCancelAppointment, onGoProntuario }) {
  return (
    <Modal title="Detalhes do agendamento" onClose={onClose} width={380}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <Avatar initials={initialsFromName(event.name)} color={event.color} size={46} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.text }}>{event.name}</div>
          <div style={{ fontSize: 12.5, color: T.muted, textTransform: "capitalize" }}>{dateLabel} às {event.time}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <Pill tone="muted">{event.type}</Pill>
        <Pill tone={event.status === "Confirmado" ? "success" : "warn"}>{event.status}</Pill>
        {event.recurring && <Pill tone="primary">Matrícula semanal</Pill>}
      </div>
      {event.recurring && (
        <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 14 }}>
          Este paciente tem matrícula fixa nesse dia e horário. Cancelar aqui remove só esta data — os próximos horários continuam agendados automaticamente.
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          onClick={onCancelAppointment}
          style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.dangerTint}`, background: T.dangerTint, color: T.danger, fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}
        >
          {event.recurring ? "Cancelar este dia" : "Cancelar agendamento"}
        </button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={onGoProntuario}>Ver prontuário</PrimaryButton>
      </div>
    </Modal>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 9, border: `1px solid ${T.border}`,
  fontSize: 14, margin: "6px 0 14px", boxSizing: "border-box", background: "#fff", color: T.text,
};

const filterInputStyle = {
  padding: "9px 12px", borderRadius: 9, border: `1px solid ${T.border}`,
  fontSize: 13.5, background: "#fff", color: T.text, minWidth: 130, boxSizing: "border-box",
};

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const WEEKDAY_FULL = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];
function weekdayIndex(offset) {
  return ((offset % 7) + 7) % 7; // 0 = Monday, since offset 0 (baseDate) is a Monday
}

function AgendaWeekStrip({ dayOffset, setDayOffset, events }) {
  const weekStart = dayOffset - weekdayIndex(dayOffset);
  const baseDate = new Date(2026, 7, 17);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <button onClick={() => setDayOffset(weekStart - 7)} style={iconBtn}><ChevronLeft size={19} /></button>
      <div style={{ display: "flex", gap: 6, flex: 1 }}>
        {WEEKDAY_LABELS.map((label, i) => {
          const offset = weekStart + i;
          const d = new Date(baseDate);
          d.setDate(baseDate.getDate() + offset);
          const isToday = offset === 0;
          const isSelected = offset === dayOffset;
          const count = (events[offset] || []).filter((e) => !e.isBreak).length;
          return (
            <button
              key={offset}
              onClick={() => setDayOffset(offset)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 4px",
                borderRadius: 10, cursor: "pointer",
                border: isSelected ? `1.5px solid ${T.primary}` : `1px solid ${T.border}`,
                background: isSelected ? T.primaryTint : "#fff",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: isSelected ? T.primaryDark : T.muted, textTransform: "uppercase" }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: isToday ? T.primary : T.text }}>{d.getDate()}</span>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: count > 0 ? T.primary : "transparent" }} />
            </button>
          );
        })}
      </div>
      <button onClick={() => setDayOffset(weekStart + 7)} style={iconBtn}><ChevronRight size={19} /></button>
    </div>
  );
}

function Agenda({ setPage }) {
  const { patients } = useAppData();
  const [dayOffset, setDayOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [defaultHour, setDefaultHour] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null); // { time, ...ev }
  const [events, setEvents] = useState(() => {
    const clone = {};
    Object.keys(weekSchedules).forEach((k) => { clone[k] = weekSchedules[k].map((e) => ({ ...e })); });
    return clone;
  });
  const [cancelledOccurrences, setCancelledOccurrences] = useState(() => new Set());

  const baseDate = new Date(2026, 7, 17);
  const shown = new Date(baseDate);
  shown.setDate(baseDate.getDate() + dayOffset);
  const label = dayOffset === 0 ? "Hoje" : shown.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" });

  const schedule = useMemo(() => {
    const manual = events[dayOffset] || [];
    const manualTimes = new Set(manual.map((e) => e.time));
    const wd = weekdayIndex(dayOffset);
    const recurring = patients
      .filter((p) => p.matricula && p.matricula.weekday === wd)
      .filter((p) => !manualTimes.has(p.matricula.time))
      .filter((p) => !cancelledOccurrences.has(`${dayOffset}|${p.id}`))
      .map((p) => ({
        time: p.matricula.time, name: p.name, type: p.matricula.tipo, color: p.color,
        status: "Confirmado", recurring: true, patientId: p.id,
      }));
    return [...manual, ...recurring].sort((a, b) => a.time.localeCompare(b.time));
  }, [dayOffset, events, patients, cancelledOccurrences]);

  const byTime = Object.fromEntries(schedule.map((e) => [e.time, e]));

  const stats = useMemo(() => {
    const real = schedule.filter((e) => !e.isBreak);
    return {
      total: real.length,
      confirmados: real.filter((e) => e.status === "Confirmado").length,
      pendentes: real.filter((e) => e.status === "Pendente").length,
      livres: HOURS.length - schedule.length,
    };
  }, [schedule]);

  const q = query.trim().toLowerCase();

  function addEvent(dayOff, ev) {
    setEvents((prev) => {
      const list = prev[dayOff] ? [...prev[dayOff]] : [];
      list.push(ev);
      return { ...prev, [dayOff]: list };
    });
  }

  function removeEvent(dayOff, time) {
    setEvents((prev) => ({
      ...prev,
      [dayOff]: (prev[dayOff] || []).filter((e) => e.time !== time),
    }));
  }

  return (
    <div>
      <PageHeader
        title="Agenda"
        subtitle="Acompanhe os seus agendamentos"
        action={<PrimaryButton icon={Plus} onClick={() => { setDefaultHour(null); setShowModal(true); }}>Novo agendamento</PrimaryButton>}
      />

      <AgendaWeekStrip dayOffset={dayOffset} setDayOffset={setDayOffset} events={events} />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => setDayOffset(0)}
          style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: dayOffset === 0 ? T.primaryTint : "#fff", color: dayOffset === 0 ? T.primaryDark : T.text, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
        >
          Hoje
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: T.text, textTransform: "capitalize" }}>{label}</span>
        <div style={{ marginLeft: "auto" }}>
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar paciente..." />
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard label="Sessões no dia" value={stats.total} icon={CalendarClock} tone="primary" />
        <StatCard label="Confirmadas" value={stats.confirmados} icon={Check} tone="success" />
        <StatCard label="A confirmar" value={stats.pendentes} icon={Clock} tone="warn" />
        <StatCard label="Horários livres" value={stats.livres} icon={CalendarDays} tone="primary" />
      </div>

      {q && (
        <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 10 }}>
          {schedule.filter((e) => !e.isBreak && e.name.toLowerCase().includes(q)).length} resultado(s) para “{query}” neste dia
        </div>
      )}

      <Card style={{ padding: "8px 0" }}>
        {HOURS.map((h, i) => {
          const ev = byTime[h];
          const matches = !q || (ev && !ev.isBreak && ev.name.toLowerCase().includes(q));
          return (
            <div key={h} style={{ display: "flex", alignItems: "stretch", minHeight: 58, borderBottom: i < HOURS.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ width: 76, flexShrink: 0, display: "flex", alignItems: "flex-start", paddingTop: 12, paddingLeft: 20, fontSize: 13, color: T.muted, fontWeight: 600 }}>
                {h}
              </div>
              <div style={{ flex: 1, padding: "8px 20px 8px 0", display: "flex", alignItems: "center" }}>
                {ev ? (
                  ev.isBreak ? (
                    <div style={{ width: "100%", background: EVENT_STYLES.gray.bg, color: "#fff", borderRadius: 10, padding: "12px 16px", fontWeight: 600, fontSize: 14 }}>
                      {ev.name}
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedEvent({ ...ev })}
                      style={{
                        width: "100%", background: EVENT_STYLES[ev.color].bg, borderLeft: `4px solid ${EVENT_STYLES[ev.color].text}`,
                        border: "none", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
                        cursor: "pointer", textAlign: "left", opacity: matches ? 1 : 0.35, transition: "opacity .15s",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: EVENT_STYLES[ev.color].text }}>{ev.name}</span>
                          {ev.status && (
                            <span style={{
                              fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
                              background: "rgba(255,255,255,0.55)", color: EVENT_STYLES[ev.color].text,
                            }}>
                              {ev.status}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12.5, color: EVENT_STYLES[ev.color].text, opacity: 0.85, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                          {ev.type === "Consulta online" ? <Video size={14} /> : <MapPin size={14} />} {ev.type}
                          {ev.recurring && <><CalendarClock size={14} style={{ marginLeft: 4 }} /> Matrícula</>}
                        </div>
                      </div>
                      <MoreVertical size={19} color={EVENT_STYLES[ev.color].text} style={{ opacity: 0.6, flexShrink: 0 }} />
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => { setDefaultHour(h); setShowModal(true); }}
                    style={{ width: "100%", padding: "10px 4px", fontSize: 13, color: "#C7CCDC", background: "none", border: "1px dashed transparent", borderRadius: 8, textAlign: "left", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = "#C7CCDC"; }}
                  >
                    + Horário livre — clique para agendar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      {showModal && (
        <NewAppointmentModal
          defaultHour={defaultHour}
          onClose={() => setShowModal(false)}
          onSave={(form) => {
            const patient = patients.find((p) => p.name === form.paciente);
            addEvent(dayOffset, { time: form.hora, name: form.paciente, type: form.tipo, status: form.status, color: patient ? patient.color : "purple" });
            setShowModal(false);
          }}
        />
      )}

      {selectedEvent && (
        <AppointmentDetailModal
          event={selectedEvent}
          dateLabel={label}
          onClose={() => setSelectedEvent(null)}
          onCancelAppointment={() => {
            if (selectedEvent.recurring) {
              setCancelledOccurrences((prev) => new Set(prev).add(`${dayOffset}|${selectedEvent.patientId}`));
            } else {
              removeEvent(dayOffset, selectedEvent.time);
            }
            setSelectedEvent(null);
          }}
          onGoProntuario={() => { setSelectedEvent(null); setPage && setPage("prontuarios"); }}
        />
      )}
    </div>
  );
}

const iconBtn = { width: 40, height: 40, borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.text };


/* ------------------------------------------------------------------ */
/* Pacientes                                                            */
/* ------------------------------------------------------------------ */
function initials2(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const textareaStyle = { ...inputStyle, minHeight: 72, resize: "vertical", fontFamily: "inherit" };

function FormField({ label, value, onChange, type = "text", placeholder, textarea, options }) {
  return (
    <div>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>{label}</label>
      {options ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={textareaStyle} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
      )}
    </div>
  );
}

const CONVENIO_OPTIONS = ["Particular", "Unimed", "Bradesco Saúde", "Amil", "SulAmérica", "Outro"];

function NewPatientModal({ onClose, onSave, editingPatient }) {
  const { patients } = useAppData();
  const [form, setForm] = useState(() =>
    editingPatient
      ? { ...editingPatient }
      : {
          name: "", nascimento: "", cpf: "", phone: "", email: "", endereco: "",
          convenio: "Particular", emergenciaNome: "", emergenciaTelefone: "",
          observacoes: "", status: "Ativo",
        }
  );

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));
  const canSubmit = form.name.trim() && form.phone.trim();

  function handleSubmit() {
    if (!canSubmit) return;
    if (editingPatient) {
      onSave({ ...editingPatient, ...form, initials: initials2(form.name) });
    } else {
      const color = COLOR_PALETTE[patients.length % COLOR_PALETTE.length];
      onSave({
        id: Date.now(),
        initials: initials2(form.name),
        sessions: 0, lastSession: "—", nextSession: "—", note: "",
        color,
        ...form,
      });
    }
  }

  return (
    <Modal title={editingPatient ? "Editar cadastro do paciente" : "Cadastro de paciente"} onClose={onClose} width={640}>
      <div style={{ fontSize: 25, fontWeight: 1000, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>Dados pessoais</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Nome completo *" value={form.name} onChange={set("name")} placeholder="Nome do paciente" />
        <FormField label="Data de nascimento" value={form.nascimento} onChange={set("nascimento")} placeholder="dd/mm/aaaa" />
        <FormField label="CPF" value={form.cpf} onChange={set("cpf")} placeholder="000.000.000-00" />
        <FormField label="Status" value={form.status} onChange={set("status")} options={["Ativo", "Inativo"]} />
      </div>

      <div style={{ fontSize: 25, fontWeight: 0, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, margin: "6px 0 8px" }}>Contato</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Telefone *" value={form.phone} onChange={set("phone")} placeholder="(00) 00000-0000" />
        <FormField label="E-mail" value={form.email} onChange={set("email")} type="email" placeholder="paciente@email.com" />
      </div>
      <FormField label="Endereço completo" value={form.endereco} onChange={set("endereco")} placeholder="Rua, número — bairro, cidade/UF" />

      <div style={{ fontSize: 25, fontWeight: 1000, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, margin: "6px 0 8px" }}>Convênio e emergência</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
        <FormField label="Convênio" value={form.convenio} onChange={set("convenio")} options={CONVENIO_OPTIONS} />
        <FormField label="Contato de emergência" value={form.emergenciaNome} onChange={set("emergenciaNome")} placeholder="Nome (parentesco)" />
        <FormField label="Telefone de emergência" value={form.emergenciaTelefone} onChange={set("emergenciaTelefone")} placeholder="(00) 00000-0000" />
      </div>

      <FormField label="Observações" value={form.observacoes} onChange={set("observacoes")} textarea placeholder="Informações adicionais relevantes" />

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Check} onClick={handleSubmit}>
          {editingPatient ? "Salvar alterações" : "Cadastrar paciente"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} color={T.primary} />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 14, color: T.text, fontWeight: 600 }}>{value || "Não informado"}</div>
      </div>
    </div>
  );
}

function DadosPessoaisTab({ patient }) {
  return (
    <Card style={{ padding: "4px 24px" }}>
      <InfoRow icon={Cake} label="Data de nascimento" value={patient.nascimento} />
      <InfoRow icon={CreditCard} label="CPF" value={patient.cpf} />
      <InfoRow icon={Phone} label="Telefone" value={patient.phone} />
      <InfoRow icon={Mail} label="E-mail" value={patient.email} />
      <InfoRow icon={Home} label="Endereço" value={patient.endereco} />
      <InfoRow icon={ShieldCheck} label="Convênio" value={patient.convenio} />
      <InfoRow icon={User} label="Contato de emergência" value={patient.emergenciaNome && patient.emergenciaTelefone ? `${patient.emergenciaNome} · ${patient.emergenciaTelefone}` : patient.emergenciaNome} />
      <div style={{ padding: "12px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 6 }}>Observações</div>
        <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.6 }}>{patient.observacoes || "Nenhuma observação registrada."}</div>
      </div>
    </Card>
  );
}

/* Anamnese — Acolhimento Infantil (todas as perguntas do formulário) */
const ANAMNESE_SECTIONS = [
  {
    title: "Dados de identificação",
    fields: [
      { key: "nome", label: "Nome" },
      { key: "dataNascimentoCrianca", label: "Data de nascimento" },
      { key: "idadeCrianca", label: "Idade" },
      { key: "religiao", label: "Religião" },
      { key: "cidade", label: "Cidade" },
      { key: "estado", label: "Estado" },
      { key: "enderecoCrianca", label: "Endereço" },
      { key: "estadoCivil", label: "Estado civil" },
      { key: "sexo", label: "Sexo" },
      { key: "escolaridade", label: "Escolaridade" },
      { key: "telefoneFixo", label: "Telefone fixo" },
      { key: "celular", label: "Celular" },
      { key: "recado", label: "Recado" },
      { key: "encaminhamento", label: "Encaminhamento", textarea: true },
      { key: "profissionalEncaminhamento", label: "Profissional responsável pelo encaminhamento" },
      { key: "buscaIndependente", label: "Busca independente (Sim/Não) — Recomendação" },
    ],
  },
  {
    title: "Dados de identificação dos pais",
    fields: [
      { key: "nomePai", label: "Nome do pai" },
      { key: "idadePai", label: "Idade do pai" },
      { key: "profissaoPai", label: "Profissão do pai" },
      { key: "empresaPai", label: "Empresa do pai" },
      { key: "escolaridadePais", label: "Escolaridade" },
      { key: "nomeMae", label: "Nome da mãe" },
      { key: "idadeMae", label: "Idade da mãe" },
      { key: "profissaoMae", label: "Profissão da mãe" },
      { key: "empresaMae", label: "Empresa da mãe" },
      { key: "enderecoPais", label: "Endereço" },
    ],
  },
  {
    title: "Queixa principal",
    fields: [
      { key: "queixaPrincipal", label: "Queixa principal", textarea: true },
    ],
  },
  {
    title: "História clínica",
    fields: [
      { key: "doencaCronica", label: "Doença crônica (Sim/Não) — Quais" },
      { key: "laudoDiagnostico", label: "Laudo/Diagnóstico" },
      { key: "cid", label: "CID" },
      { key: "tempoDiagnostico", label: "Há quanto tempo recebeu o diagnóstico" },
      { key: "primeirosSinais", label: "Primeiros sinais que apresentou", textarea: true },
      { key: "quemPercebeuSinais", label: "Quem percebeu os sinais (Família/Escola/Outros)" },
      { key: "relateSobre", label: "Relate sobre", textarea: true },
    ],
  },
  {
    title: "Medicamentos e intervenções",
    fields: [
      { key: "usoMedicamentos", label: "Uso de medicamentos (Sim/Não) — Quais" },
      { key: "quantoTempoMedicamento", label: "Quanto tempo" },
      { key: "casosInternacao", label: "Casos de internação" },
      { key: "motivoInternacao", label: "Motivo" },
      { key: "limitacoes", label: "Limitações (auditiva, visual, motora, fala, outra)" },
      { key: "psicoterapiaPsiquiatra", label: "Psicoterapia / Psiquiatra / Neurologista" },
      { key: "outrosEspecialistas", label: "Já procurou outros especialistas? Quais?" },
      { key: "tratamentoAtual", label: "Está fazendo tratamento médico, psicológico, psiquiátrico ou neurológico?" },
      { key: "porque", label: "Por quê?" },
      { key: "convulsoes", label: "A criança tem/teve convulsões (com ou sem febre)?" },
      { key: "traumatismo", label: "Já teve traumatismo?" },
      { key: "cirurgia", label: "Já realizou alguma cirurgia? Qual?" },
    ],
  },
  {
    title: "Período gestacional e pós-parto",
    fields: [
      { key: "problemasGestacao", label: "Problemas de saúde na gestação", textarea: true },
      { key: "condicoesEmocionais", label: "Condições emocionais na gestação e pós-parto", textarea: true },
      { key: "eventosGestacao", label: "Eventos significativos neste período", textarea: true },
    ],
  },
  {
    title: "Dados do nascimento",
    fields: [
      { key: "peso", label: "Peso" },
      { key: "centimetros", label: "Centímetros" },
      { key: "apgar", label: "Apgar" },
      { key: "coloracao", label: "Coloração" },
      { key: "problemasPosParto", label: "Relate se houve problemas pós-parto", textarea: true },
    ],
  },
  {
    title: "Comunicação",
    fields: [
      { key: "comunicacaoAtual", label: "Comunicação atual (se fala, quantas palavras, atraso na linguagem, primeiras vocalizações, etc.)", textarea: true },
      { key: "balbucios", label: "Balbucios" },
      { key: "ecolalias", label: "Presença de ecolalias (Sim/Não) — Outros/quais" },
    ],
  },
  {
    title: "Motricidade",
    fields: [
      { key: "sentar", label: "Sentar" },
      { key: "engatinhar", label: "Engatinhar" },
      { key: "andar", label: "Andar" },
      { key: "pontaPes", label: "Caminhar na ponta dos pés (Sim/Não) — Quanto tempo" },
    ],
  },
  {
    title: "Alimentação",
    fields: [
      { key: "amamentacao", label: "Amamentação (Sim/Não) — Quanto tempo" },
      { key: "mamadeiras", label: "Mamadeiras (Sim/Não) — Quanto tempo" },
      { key: "forcadaAlimentar", label: "A criança é forçada a se alimentar? Explique", textarea: true },
      { key: "seletividadeAlimentar", label: "Seletividade alimentar (texturas, gosto, cor, temperatura, outros)", textarea: true },
      { key: "ajudaAlimentacao", label: "Recebe ajuda na alimentação?" },
    ],
  },
  {
    title: "Sono",
    fields: [
      { key: "dormeBem", label: "A criança dorme bem?" },
      { key: "comoSono", label: "Como é seu sono (agitado, tranquilo)" },
      { key: "rangeDentes", label: "Range os dentes ao dormir?" },
      { key: "quartoSeparado", label: "Dorme em quarto separado dos pais?" },
    ],
  },
  {
    title: "Autonomia",
    fields: [
      { key: "vesteSozinho", label: "Veste-se sozinho?" },
      { key: "banhoSozinho", label: "Toma banho sozinho?" },
      { key: "controleEsfincteres", label: "Controle de esfíncteres" },
      { key: "fraldas", label: "Fez ou faz uso de fraldas? Quanto tempo" },
      { key: "desfralde", label: "Como foi o desfralde" },
      { key: "chupetas", label: "Chupetas — quanto tempo" },
      { key: "retiradaChupeta", label: "Como foi a retirada" },
    ],
  },
  {
    title: "História familiar",
    fields: [
      { key: "dinamicaFamiliar", label: "Dinâmica familiar", textarea: true },
      { key: "relacaoPais", label: "Relação com os pais", textarea: true },
      { key: "relacaoIrmaos", label: "Relação com irmãos", textarea: true },
      { key: "transtornosFamilia", label: "Presença de transtornos e/ou deficiências na família", textarea: true },
    ],
  },
  {
    title: "História social",
    fields: [
      { key: "brincarSozinhaAmigos", label: "Prefere brincar sozinha(o) ou com amigos?" },
      { key: "descrevaBrincar", label: "Descreva o brincar do seu filho(a)", textarea: true },
      { key: "amigosFacilidade", label: "Faz amigos com facilidade?" },
      { key: "adaptaMeio", label: "Adapta-se facilmente ao meio?" },
      { key: "escolaSocializacao", label: "Escola (socialização)", textarea: true },
      { key: "rotinaCrianca", label: "Rotina da criança (atividades extras, etc.)", textarea: true },
    ],
  },
  {
    title: "Dados escolares",
    fields: [
      { key: "dadosEscola", label: "Dados da escola (ano de inserção, período, queixas, dificuldades, etc.)", textarea: true },
      { key: "gostaEscola", label: "A criança gosta de ir à escola?" },
      { key: "aceitaAmigos", label: "É bem aceita pelos amigos ou é isolada?" },
      { key: "reprovacaoDificuldades", label: "Casos de reprovação / áreas de dificuldades", textarea: true },
    ],
  },
  {
    title: "Comportamento",
    fields: [
      { key: "caracteristicasComportamento", label: "Características predominantes (agressiva, passiva, dependente, independente, inquieta, medrosa, retraída, desligada, excitada, outros)", textarea: true },
      { key: "reageContrariada", label: "Como reage quando contrariada?" },
      { key: "eventosSignificativos", label: "Eventos significativos", textarea: true },
      { key: "autoagressao", label: "Autoagressão — quais e comportamento que antecede o ocorrido", textarea: true },
      { key: "heteroagressao", label: "Heteroagressão — quais e comportamento que antecede o ocorrido", textarea: true },
      { key: "comportamentosDestrutivos", label: "Comportamentos destrutivos — quais e comportamento que antecede o ocorrido", textarea: true },
      { key: "movimentosEstereotipados", label: "Movimentos estereotipados (flap de mãos, balanço, etc.) — quais" },
      { key: "alinhamentoEmpilhamento", label: "Alinhamento / empilhamento / gosta de objetos que rodam ou piscam" },
      { key: "outrosComportamentos", label: "Outros" },
    ],
  },
  {
    title: "Medidas disciplinares",
    fields: [
      { key: "medidasDisciplinares", label: "Quais as medidas disciplinares normalmente utilizadas com a criança?", textarea: true },
      { key: "quemUsaMedidas", label: "Quem as usa?" },
      { key: "reacaoMedidas", label: "Quais as reações da criança frente a essas medidas?", textarea: true },
    ],
  },
  {
    title: "Preferências e reforços",
    fields: [
      { key: "atividadesPreferidas", label: "Atividades / brinquedos preferidos", textarea: true },
    ],
  },
];

const ANAMNESE_FIELDS = ANAMNESE_SECTIONS.flatMap((s) => s.fields);

function AnamneseForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  return (
    <Card style={{ padding: 24, marginBottom: 16 }}>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 18 }}>
        Preencha a anamnese do paciente. Você pode registrar quantas anamneses forem necessárias e editar qualquer uma delas depois.
      </div>
      {ANAMNESE_SECTIONS.map((section) => (
        <div key={section.title} style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>
            {section.title}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            {section.fields.map((f) => (
              <div key={f.key} style={{ gridColumn: f.textarea ? "1 / -1" : undefined }}>
                <FormField label={f.label} value={form[f.key]} onChange={(v) => setForm({ ...form, [f.key]: v })} textarea={f.textarea} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, marginTop: 8, position: "sticky", bottom: 0, background: T.surface, paddingTop: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Check} onClick={() => onSave(form)}>Salvar anamnese</PrimaryButton>
      </div>
    </Card>
  );
}

function AnamneseTab({ patient }) {
  const { anamneses, saveAnamnese } = useAppData();
  const list = anamneses[patient.id] || [];
  const [editingId, setEditingId] = useState(null); // null | "new" | entry id

  function blankForm() {
    return Object.fromEntries(ANAMNESE_FIELDS.map((f) => [f.key, ""]));
  }

  function handleSave(form) {
    const id = editingId === "new" ? Date.now() : editingId;
    const preenchidoEm = editingId === "new" ? todayLabel() : form.preenchidoEm;
    saveAnamnese(patient.id, { ...form, id, preenchidoEm });
    setEditingId(null);
  }

  if (editingId !== null) {
    const editingEntry = editingId === "new" ? blankForm() : list.find((a) => a.id === editingId);
    return <AnamneseForm initial={editingEntry} onCancel={() => setEditingId(null)} onSave={handleSave} />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
          {list.length} {list.length === 1 ? "anamnese registrada" : "anamneses registradas"}
        </div>
        <PrimaryButton icon={Plus} onClick={() => setEditingId("new")}>Nova anamnese</PrimaryButton>
      </div>

      {list.length === 0 ? (
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 13.5, color: T.muted }}>Nenhuma anamnese registrada ainda para este paciente.</div>
        </Card>
      ) : (
        list.map((entry) => {
          const filledSections = ANAMNESE_SECTIONS
            .map((section) => ({ ...section, fields: section.fields.filter((f) => entry[f.key]) }))
            .filter((section) => section.fields.length > 0);
          return (
            <Card key={entry.id} style={{ padding: 24, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: T.muted }}>Preenchida em {entry.preenchidoEm}</div>
                <button onClick={() => setEditingId(entry.id)} style={{ ...iconBtn, background: "#fff" }} title="Editar anamnese"><Edit3 size={20} /></button>
              </div>
              {filledSections.length === 0 ? (
                <div style={{ fontSize: 13.5, color: T.muted }}>Nenhuma pergunta respondida ainda.</div>
              ) : (
                filledSections.map((section) => (
                  <div key={section.title} style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>
                      {section.title}
                    </div>
                    {section.fields.map((f) => (
                      <div key={f.key} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>{f.label}</div>
                        <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.6 }}>{entry[f.key]}</div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}

function blankRecordForm() {
  return { sessao: "", date: todayLabel(), tecnicas: "", objetivo: "", descricao: "" };
}

function RecordForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  return (
    <Card style={{ padding: 24, marginBottom: 16 }}>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 18 }}>
        Registre a sessão diretamente no sistema. Você pode criar quantos registros forem necessários e editar qualquer um deles depois.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Sessão" value={form.sessao} onChange={(v) => setForm({ ...form, sessao: v })} placeholder="Ex: Sessão 12" />
        <FormField label="Data" value={form.date} onChange={(v) => setForm({ ...form, date: v })} placeholder="dd/mm/aaaa" />
      </div>
      <FormField label="Técnicas utilizadas" value={form.tecnicas} onChange={(v) => setForm({ ...form, tecnicas: v })} placeholder="Ex: escuta ativa, reestruturação cognitiva" />
      <FormField label="Objetivo da sessão" value={form.objetivo} onChange={(v) => setForm({ ...form, objetivo: v })} placeholder="Ex: reduzir sintomas de ansiedade" />
      <FormField label="Descrição / relato de atendimento" value={form.descricao} onChange={(v) => setForm({ ...form, descricao: v })} textarea placeholder="Descreva o que foi trabalhado na sessão..." />
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Check} onClick={() => onSave(form)}>Salvar prontuário</PrimaryButton>
      </div>
    </Card>
  );
}

function RecordCard({ entry, onEdit }) {
  return (
    <Card style={{ padding: 22, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{entry.sessao || "Sessão"}</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{entry.date}</div>
        </div>
        <button onClick={onEdit} style={{ ...iconBtn, background: "#fff" }} title="Editar registro"><Edit3 size={20} /></button>
      </div>
      {entry.tecnicas && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>Técnicas utilizadas</div>
          <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.6 }}>{entry.tecnicas}</div>
        </div>
      )}
      {entry.objetivo && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>Objetivo da sessão</div>
          <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.6 }}>{entry.objetivo}</div>
        </div>
      )}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>Descrição / relato de atendimento</div>
        <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{entry.descricao || "—"}</div>
      </div>
    </Card>
  );
}

function ProntuarioTab({ patient }) {
  const { records, saveRecord } = useAppData();
  const list = records[patient.id] || [];
  const [editingId, setEditingId] = useState(null); // null | "new" | entry id

  function handleSave(form) {
    const id = editingId === "new" ? Date.now() : editingId;
    saveRecord(patient.id, { ...form, id });
    setEditingId(null);
  }

  if (editingId !== null) {
    const editingEntry = editingId === "new" ? blankRecordForm() : list.find((r) => r.id === editingId);
    return <RecordForm initial={editingEntry} onCancel={() => setEditingId(null)} onSave={handleSave} />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
          {list.length} {list.length === 1 ? "registro no prontuário" : "registros no prontuário"}
        </div>
        <PrimaryButton icon={Plus} onClick={() => setEditingId("new")}>Novo registro</PrimaryButton>
      </div>

      {list.length === 0 ? (
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 13.5, color: T.muted }}>Nenhum registro no prontuário ainda para este paciente.</div>
        </Card>
      ) : (
        list.map((entry) => (
          <RecordCard key={entry.id} entry={entry} onEdit={() => setEditingId(entry.id)} />
        ))
      )}
    </div>
  );
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentosTab({ patient }) {
  const { documents, addDocument, removeDocument } = useAppData();
  const list = documents[patient.id] || [];
  const [title, setTitle] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const fileRef = useRef(null);

  function handleAdd() {
    if (!pendingFile || !title.trim()) return;
    addDocument(patient.id, {
      id: Date.now(),
      title: title.trim(),
      fileName: pendingFile.name,
      size: pendingFile.size,
      url: URL.createObjectURL(pendingFile),
      date: todayLabel(),
    });
    setTitle("");
    setPendingFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <Card style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 14 }}>
          Adicionar documento
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <FormField label="Título do documento" value={title} onChange={setTitle} placeholder="Ex: Laudo médico" />
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Arquivo</label>
            <input
              ref={fileRef}
              type="file"
              onChange={(e) => setPendingFile(e.target.files[0] || null)}
              style={{ ...inputStyle, padding: "7px 12px" }}
            />
          </div>
        </div>
        <PrimaryButton icon={Paperclip} onClick={handleAdd} style={{ marginTop: 4 }}>
          Salvar documento
        </PrimaryButton>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
          {list.length} {list.length === 1 ? "documento anexado" : "documentos anexados"}
        </div>
        {list.length === 0 ? (
          <div style={{ fontSize: 13.5, color: T.muted, padding: 20 }}>Nenhum documento anexado ainda para este paciente.</div>
        ) : (
          list.map((d, i) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText size={20} color={T.primary} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                <div style={{ fontSize: 12, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.fileName} · {formatFileSize(d.size)} · Anexado em {d.date}
                </div>
              </div>
              <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ ...iconBtn, textDecoration: "none" }} title="Abrir documento"><Eye size={20} /></a>
              <button onClick={() => removeDocument(patient.id, d.id)} style={{ ...iconBtn, background: "#fff" }} title="Remover documento"><Trash2 size={20} /></button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

const SITUACOES = [
  { key: "Pendente", label: "Aberto", tone: "warn" },
  { key: "Pago", label: "Recebido", tone: "success" },
  { key: "Atrasado", label: "Em atraso", tone: "danger" },
];

function parseBrDate(str) {
  if (!str) return null;
  const [d, m, y] = str.split("/").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

function FinanceiroTab({ patient }) {
  const { receivables, addReceivable } = useAppData();
  const [showModal, setShowModal] = useState(false);
  const mine = receivables.filter((r) => r.paciente === patient.name);
  const totalPago = mine.filter((r) => r.status === "Pago").reduce((s, r) => s + r.valor, 0);
  const totalAberto = mine.filter((r) => r.status !== "Pago").reduce((s, r) => s + r.valor, 0);

  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [situacaoSel, setSituacaoSel] = useState(SITUACOES.map((s) => s.key));
  const [showSituacaoMenu, setShowSituacaoMenu] = useState(false);
  const [applied, setApplied] = useState({ dateStart: "", dateEnd: "", situacaoSel: SITUACOES.map((s) => s.key) });

  const filtered = mine.filter((r) => {
    if (!applied.situacaoSel.includes(r.status)) return false;
    const venc = parseBrDate(r.vencimento);
    const start = applied.dateStart ? parseBrDate(applied.dateStart) : null;
    const end = applied.dateEnd ? parseBrDate(applied.dateEnd) : null;
    if (start && venc && venc < start) return false;
    if (end && venc && venc > end) return false;
    return true;
  });

  function toggleSituacao(key) {
    setSituacaoSel((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function applyFilters() {
    setApplied({ dateStart, dateEnd, situacaoSel });
    setShowSituacaoMenu(false);
  }

  function clearFilters() {
    setDateStart(""); setDateEnd(""); setSituacaoSel(SITUACOES.map((s) => s.key));
    setApplied({ dateStart: "", dateEnd: "", situacaoSel: SITUACOES.map((s) => s.key) });
  }

  const situacaoLabel = situacaoSel.length === SITUACOES.length
    ? "Todas"
    : SITUACOES.filter((s) => situacaoSel.includes(s.key)).map((s) => s.label).join(", ") || "Nenhuma";

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard label="Total pago" value={`R$ ${totalPago.toLocaleString("pt-BR")}`} icon={TrendingUp} tone="success" />
        <StatCard label="Em aberto" value={`R$ ${totalAberto.toLocaleString("pt-BR")}`} icon={Clock} tone={totalAberto > 0 ? "danger" : "primary"} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14.5, color: T.text }}>Lançamentos</span>
        <PrimaryButton icon={Plus} onClick={() => setShowModal(true)}>Novo lançamento</PrimaryButton>
      </div>

      <Card style={{ padding: "16px 20px", marginBottom: 16, overflow: "visible" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 22, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Data</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, padding: "9px 0" }}>Vencimento</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Data inicial</div>
            <input value={dateStart} onChange={(e) => setDateStart(e.target.value)} placeholder="dd/mm/aaaa" style={filterInputStyle} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Data final</div>
            <input value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} placeholder="dd/mm/aaaa" style={filterInputStyle} />
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Situação</div>
            <button
              onClick={() => setShowSituacaoMenu((v) => !v)}
              style={{ ...filterInputStyle, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, cursor: "pointer", minWidth: 170 }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{situacaoLabel}</span>
              <ChevronDown size={19} color={T.muted} />
            </button>
            {showSituacaoMenu && (
              <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 6, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: "0 10px 30px rgba(20,24,38,0.14)", padding: 8, zIndex: 5, minWidth: 180 }}>
                {SITUACOES.map((s) => (
                  <label key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", fontSize: 13.5, color: T.text, cursor: "pointer" }}>
                    <input type="checkbox" checked={situacaoSel.includes(s.key)} onChange={() => toggleSituacao(s.key)} />
                    {s.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button onClick={clearFilters} style={{ ...iconBtn, background: "#fff" }} title="Limpar filtros"><X size={20} /></button>
          <button
            onClick={applyFilters}
            style={{ background: "none", border: "none", color: T.primary, fontWeight: 700, fontSize: 13, cursor: "pointer", textTransform: "uppercase", letterSpacing: 0.3, padding: "10px 0" }}
          >
            Aplicar filtros
          </button>
        </div>
      </Card>

      <Card style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFBFE", textAlign: "left" }}>
              {["Descrição", "Vencimento", "Recebimento", "Valor", "Recebido", "Situação", ""].map((h) => (
                <th key={h} style={{ padding: "12px 20px", fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 24, fontSize: 13.5, color: T.muted }}>Nenhum lançamento encontrado para os filtros selecionados.</td></tr>
            ) : filtered.map((r, i) => {
              const situ = SITUACOES.find((s) => s.key === r.status) || SITUACOES[0];
              return (
                <tr key={r.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
                  <td style={{ padding: "14px 20px", fontSize: 13.5, color: T.text, fontWeight: 600 }}>{r.referencia}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13.5, color: T.text }}>{r.vencimento}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13.5, color: T.text }}>{r.status === "Pago" ? r.vencimento : "—"}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13.5, color: T.text, fontWeight: 600 }}>R$ {r.valor.toLocaleString("pt-BR")}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13.5, color: r.status === "Pago" ? T.success : T.muted, fontWeight: 600 }}>
                    {r.status === "Pago" ? `R$ ${r.valor.toLocaleString("pt-BR")}` : "—"}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <Pill tone={situ.tone}>{situ.label}</Pill>
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16 }}>
                      {r.status !== "Pago" && (
                        <button style={{ background: "none", border: "none", color: T.primary, fontWeight: 700, fontSize: 12.5, cursor: "pointer", letterSpacing: 0.3 }}>RECEBER</button>
                      )}
                      <MoreVertical size={19} color={T.muted} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <NewReceivableModal
          defaultPatientName={patient.name}
          onClose={() => setShowModal(false)}
          onSave={(entry) => { addReceivable(entry); setShowModal(false); }}
        />
      )}
    </div>
  );
}

function MatriculaTab({ patient }) {
  const { updatePatient } = useAppData();
  const [editing, setEditing] = useState(!patient.matricula);
  const [weekday, setWeekday] = useState(patient.matricula ? patient.matricula.weekday : 0);
  const [time, setTime] = useState(patient.matricula ? patient.matricula.time : HOURS[0]);
  const [tipo, setTipo] = useState(patient.matricula ? patient.matricula.tipo : "Consulta presencial");

  function handleSave() {
    updatePatient(patient.id, { matricula: { weekday, time, tipo } });
    setEditing(false);
  }

  function handleRemove() {
    updatePatient(patient.id, { matricula: null });
    setEditing(true);
  }

  if (!editing && patient.matricula) {
    return (
      <Card style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Matrícula ativa</div>
            <div style={{ fontSize: 12.5, color: T.muted, maxWidth: 440 }}>
              Este paciente entra automaticamente na agenda toda semana nesse dia e horário, sem precisar agendar manualmente.
            </div>
          </div>
          <button onClick={() => setEditing(true)} style={{ ...iconBtn, background: "#fff" }} title="Editar matrícula"><Edit3 size={20} /></button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, background: T.primaryTint, borderRadius: 12, padding: "16px 20px" }}>
          <div style={{ width: 46, height: 46, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CalendarClock size={22} color={T.primary} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.primaryDark }}>
              Toda {WEEKDAY_FULL[patient.matricula.weekday]}, às {patient.matricula.time}
            </div>
            <div style={{ fontSize: 12.5, color: T.primaryDark, opacity: 0.8, marginTop: 2 }}>{patient.matricula.tipo}</div>
          </div>
        </div>
        <button onClick={handleRemove} style={{ marginTop: 16, background: "none", border: "none", color: T.danger, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0 }}>
          Remover matrícula
        </button>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 24 }}>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 14 }}>
        Defina um dia da semana e horário fixos para este paciente. Ele será incluído automaticamente na agenda toda semana, sem precisar agendar manualmente.
      </div>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Dia da semana</label>
      <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} style={inputStyle}>
        {WEEKDAY_FULL.map((label, i) => <option key={i} value={i}>{label}</option>)}
      </select>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Horário</label>
      <select value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle}>
        {HOURS.map((h) => <option key={h}>{h}</option>)}
      </select>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Tipo de consulta</label>
      <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
        <option>Consulta presencial</option>
        <option>Consulta online</option>
      </select>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        {patient.matricula && (
          <button onClick={() => setEditing(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        )}
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Check} onClick={handleSave}>Salvar matrícula</PrimaryButton>
      </div>
    </Card>
  );
}

const PROFILE_TABS = [
  { key: "dados", label: "Dados pessoais", icon: User },
  { key: "prontuario", label: "Prontuários", icon: FileText },
  { key: "anamnese", label: "Anamnese", icon: HeartPulse },
  { key: "documentos", label: "Documentos", icon: Paperclip },
  { key: "financeiro", label: "Financeiro", icon: Wallet },
  { key: "matricula", label: "Matrícula", icon: CalendarClock },
];

function PatientProfile({ patientId, onBack }) {
  const { patients, updatePatient } = useAppData();
  const [tab, setTab] = useState("dados");
  const [showEdit, setShowEdit] = useState(false);
  const patient = patients.find((p) => p.id === patientId);
  if (!patient) return null;

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: T.primary, fontWeight: 700, fontSize: 13.5, cursor: "pointer", padding: 0, marginBottom: 16 }}>
        <ArrowLeft size={18} /> Voltar para pacientes
      </button>

      <Card style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <Avatar initials={patient.initials} color={patient.color} size={72} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 22, color: T.text }}>{patient.name}</span>
              <Pill tone={patient.status === "Ativo" ? "success" : "muted"}>{patient.status}</Pill>
            </div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
              {patient.sessions} sessões · última em {patient.lastSession} · próxima {patient.nextSession}
            </div>
          </div>
          <PrimaryButton icon={Edit3} onClick={() => setShowEdit(true)}>Editar cadastro</PrimaryButton>
        </div>
      </Card>

      <div style={{ display: "flex", marginBottom: 24, borderBottom: `1px solid ${T.border}` }}>
        {PROFILE_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: "0 0 14px", background: "none", cursor: "pointer",
                border: "none", borderBottom: active ? `3px solid ${T.primary}` : "3px solid transparent",
                marginBottom: -1, color: active ? T.primary : T.muted,
                fontWeight: 800, fontSize: 14.5, textTransform: "uppercase", letterSpacing: 0.5,
                textAlign: "center", whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "dados" && <DadosPessoaisTab patient={patient} />}
      {tab === "anamnese" && <AnamneseTab patient={patient} />}
      {tab === "prontuario" && <ProntuarioTab patient={patient} />}
      {tab === "financeiro" && <FinanceiroTab patient={patient} />}
      {tab === "documentos" && <DocumentosTab patient={patient} />}
      {tab === "matricula" && <MatriculaTab patient={patient} />}

      {showEdit && (
        <NewPatientModal
          editingPatient={patient}
          onClose={() => setShowEdit(false)}
          onSave={(updated) => { updatePatient(patient.id, updated); setShowEdit(false); }}
        />
      )}
    </div>
  );
}

function Pacientes() {
  const { patients, addPatient } = useAppData();
  const [query, setQuery] = useState("");
  const [viewingId, setViewingId] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const filtered = patients.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  if (viewingId) {
    return <PatientProfile patientId={viewingId} onBack={() => setViewingId(null)} />;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color: T.text, margin: 0 }}>Pacientes</h1>
          <SearchInput value={query} onChange={setQuery} placeholder="Pesquisar" />
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 700, fontSize: 13.5, color: T.text, cursor: "pointer" }}>
            <SlidersHorizontal size={20} /> FILTROS
          </button>
          <PrimaryButton icon={Plus} onClick={() => setShowNewModal(true)}>NOVO PACIENTE</PrimaryButton>
        </div>
      </div>

      <Card style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFBFE", textAlign: "left" }}>
              {["Paciente", "Contato", "Sessões", "Última sessão", "Próxima sessão", "Situação", ""].map((h) => (
                <th key={h} style={{ padding: "14px 20px", fontSize: 12.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => setViewingId(p.id)}
                style={{ borderTop: `1px solid ${T.border}`, cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFE")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar initials={p.initials} color={p.color} size={40} />
                    <span style={{ fontWeight: 600, fontSize: 14.5, color: T.text }}>{p.name}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: T.muted }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}><Phone size={16} /> {p.phone}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={16} /> {p.email}</div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 14, color: T.text, fontWeight: 600 }}>{p.sessions}</td>
                <td style={{ padding: "14px 20px", fontSize: 13.5, color: T.text }}>{p.lastSession}</td>
                <td style={{ padding: "14px 20px", fontSize: 13.5, color: T.text }}>{p.nextSession}</td>
                <td style={{ padding: "14px 20px" }}>
                  <Pill tone={p.status === "Ativo" ? "success" : "muted"}>{p.status}</Pill>
                </td>
                <td style={{ padding: "14px 20px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14 }}>
                    <button onClick={() => setViewingId(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex" }} title="Abrir paciente">
                      <ExternalLink size={18} />
                    </button>
                    <button style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex" }}>
                      <MoreVertical size={19} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: `1px solid ${T.border}`, fontSize: 13, color: T.muted }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            Página <strong style={{ color: T.text }}>1</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span>{filtered.length === 0 ? "0" : `1–${filtered.length}`} de {filtered.length}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button disabled style={{ ...iconBtn, background: "#fff", opacity: 0.4, cursor: "default" }}><ChevronLeft size={19} /></button>
              <button disabled style={{ ...iconBtn, background: "#fff", opacity: 0.4, cursor: "default" }}><ChevronRight size={19} /></button>
            </div>
          </div>
        </div>
      </Card>

      {showNewModal && (
        <NewPatientModal
          onClose={() => setShowNewModal(false)}
          onSave={(newPatient) => { addPatient(newPatient); setShowNewModal(false); }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Prontuários                                                          */
/* ------------------------------------------------------------------ */
function todayLabel() {
  return new Date(2026, 7, 17).toLocaleDateString("pt-BR");
}

function Prontuarios() {
  const { patients, records, saveRecord } = useAppData();
  const [selected, setSelected] = useState(patients[0].id);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null); // null | "new" | entry id

  const active = patients.find((p) => p.id === selected);
  const filtered = patients.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  const history = records[selected] || [];

  function handleSave(form) {
    const id = editingId === "new" ? Date.now() : editingId;
    saveRecord(selected, { ...form, id });
    setEditingId(null);
  }

  return (
    <div>
      <PageHeader
        title="Prontuários"
        subtitle="Histórico clínico e evolução dos pacientes"
        action={<PrimaryButton icon={Plus} onClick={() => setEditingId("new")}>Novo prontuário</PrimaryButton>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
        <Card style={{ padding: 12, height: "fit-content" }}>
          <div style={{ padding: "4px 6px 10px" }}>
            <SearchInput value={query} onChange={setQuery} placeholder="Buscar paciente..." />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 480, overflowY: "auto" }}>
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelected(p.id); setEditingId(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 10, border: "none",
                  background: selected === p.id ? T.primaryTint : "transparent", cursor: "pointer", textAlign: "left",
                }}
              >
                <Avatar initials={p.initials} color={p.color} size={32} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{(records[p.id] || []).length} registros</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <Avatar initials={active.initials} color={active.color} size={50} />
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: T.text }}>{active.name}</div>
              <div style={{ fontSize: 13, color: T.muted }}>{active.sessions} sessões · {active.status}</div>
            </div>
            {editingId === null && (
              <button onClick={() => setEditingId("new")} style={{ ...iconBtn, marginLeft: "auto", background: "#fff" }} title="Novo registro"><Plus size={18} /></button>
            )}
          </div>

          {editingId !== null ? (
            <RecordForm
              initial={editingId === "new" ? blankRecordForm() : history.find((r) => r.id === editingId)}
              onCancel={() => setEditingId(null)}
              onSave={handleSave}
            />
          ) : history.length === 0 ? (
            <Card style={{ padding: 24 }}>
              <div style={{ fontSize: 13.5, color: T.muted }}>Nenhum registro no prontuário ainda para este paciente.</div>
            </Card>
          ) : (
            history.map((entry) => (
              <RecordCard key={entry.id} entry={entry} onEdit={() => setEditingId(entry.id)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Relatórios                                                           */
/* ------------------------------------------------------------------ */
const MONTHS_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const REPORT_TODAY = new Date(2026, 7, 17);

function ageFromBrDate(str, ref = REPORT_TODAY) {
  const d = parseBrDate(str);
  if (!d) return null;
  let age = ref.getFullYear() - d.getFullYear();
  const monthDiff = ref.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < d.getDate())) age--;
  return age;
}

function daysBetweenBr(fromStr, toStr = null) {
  const from = parseBrDate(fromStr);
  const to = toStr ? parseBrDate(toStr) : REPORT_TODAY;
  if (!from || !to) return null;
  return Math.round((to - from) / 86400000);
}

const AGE_BUCKETS = [
  { label: "0–17", test: (a) => a <= 17 },
  { label: "18–25", test: (a) => a >= 18 && a <= 25 },
  { label: "26–35", test: (a) => a >= 26 && a <= 35 },
  { label: "36–45", test: (a) => a >= 36 && a <= 45 },
  { label: "46–60", test: (a) => a >= 46 && a <= 60 },
  { label: "60+", test: (a) => a > 60 },
];

const REPORT_CATEGORIES = [
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

function FilterField({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function FilterBar({ children, onApply }) {
  return (
    <Card style={{ padding: "16px 20px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 22, flexWrap: "wrap" }}>
        {children}
        <button
          onClick={onApply}
          style={{ background: "none", border: "none", color: T.primary, fontWeight: 700, fontSize: 13, cursor: "pointer", textTransform: "uppercase", letterSpacing: 0.3, padding: "10px 0" }}
        >
          Aplicar filtros
        </button>
      </div>
    </Card>
  );
}

function ReportTableCard({ countLabel, columns, rows, emptyText, renderRow }) {
  return (
    <Card style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 13.5, color: T.text }}>{countLabel}</span>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...iconBtn, background: "#fff" }} title="Imprimir"><Printer size={20} /></button>
          <button style={{ ...iconBtn, background: "#fff" }} title="Exportar"><Download size={20} /></button>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#FAFBFE", textAlign: "left" }}>
            {columns.map((h) => (
              <th key={h} style={{ padding: "12px 20px", fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ padding: 24, fontSize: 13.5, color: T.muted }}>{emptyText}</td></tr>
          ) : rows.map(renderRow)}
        </tbody>
      </table>
    </Card>
  );
}

const reportCellStyle = { padding: "14px 20px", fontSize: 13.5, color: T.text };

/* Pacientes ---------------------------------------------------------- */
function ReportListaPacientes() {
  const { patients } = useAppData();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [convenioFilter, setConvenioFilter] = useState("Todos");
  const [applied, setApplied] = useState({ query: "", statusFilter: "Todos", convenioFilter: "Todos" });

  const convenios = ["Todos", ...Array.from(new Set(patients.map((p) => p.convenio).filter(Boolean)))];

  const filtered = patients.filter((p) => {
    if (applied.statusFilter !== "Todos" && p.status !== applied.statusFilter) return false;
    if (applied.convenioFilter !== "Todos" && p.convenio !== applied.convenioFilter) return false;
    if (applied.query && !p.name.toLowerCase().includes(applied.query.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <FilterBar onApply={() => setApplied({ query, statusFilter, convenioFilter })}>
        <FilterField label="Paciente">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome" style={filterInputStyle} />
        </FilterField>
        <FilterField label="Situação do paciente">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...filterInputStyle, minWidth: 150 }}>
            {["Todos", "Ativo", "Inativo"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </FilterField>
        <FilterField label="Convênio">
          <select value={convenioFilter} onChange={(e) => setConvenioFilter(e.target.value)} style={{ ...filterInputStyle, minWidth: 150 }}>
            {convenios.map((c) => <option key={c}>{c}</option>)}
          </select>
        </FilterField>
      </FilterBar>

      <ReportTableCard
        countLabel={<>Total de pacientes: <strong>{filtered.length}</strong></>}
        columns={["Paciente", "Convênio", "Sessões", "Última sessão", "Próxima sessão", "Situação"]}
        rows={filtered}
        emptyText="Nenhum paciente encontrado para os filtros selecionados."
        renderRow={(p, i) => (
          <tr key={p.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{p.name}</td>
            <td style={reportCellStyle}>{p.convenio || "—"}</td>
            <td style={reportCellStyle}>{p.sessions}</td>
            <td style={reportCellStyle}>{p.lastSession}</td>
            <td style={reportCellStyle}>{p.nextSession}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={p.status === "Ativo" ? "success" : "muted"}>{p.status}</Pill></td>
          </tr>
        )}
      />
    </div>
  );
}

function ReportAniversariantes() {
  const { patients } = useAppData();
  const [month, setMonth] = useState(REPORT_TODAY.getMonth());
  const [includeInactive, setIncludeInactive] = useState(true);
  const [applied, setApplied] = useState({ month: REPORT_TODAY.getMonth(), includeInactive: true });

  const rows = patients
    .filter((p) => {
      const d = parseBrDate(p.nascimento);
      if (!d || d.getMonth() !== applied.month) return false;
      if (!applied.includeInactive && p.status !== "Ativo") return false;
      return true;
    })
    .sort((a, b) => parseBrDate(a.nascimento).getDate() - parseBrDate(b.nascimento).getDate());

  return (
    <div>
      <FilterBar onApply={() => setApplied({ month, includeInactive })}>
        <FilterField label="Mês">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ ...filterInputStyle, minWidth: 150 }}>
            {MONTHS_PT.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        </FilterField>
        <FilterField label="Incluir inativos">
          <div style={{ padding: "9px 0" }}>
            <Switch checked={includeInactive} onChange={setIncludeInactive} />
          </div>
        </FilterField>
      </FilterBar>

      <ReportTableCard
        countLabel={<>Aniversariantes em {MONTHS_PT[applied.month]}: <strong>{rows.length}</strong></>}
        columns={["Paciente", "Telefone", "Data de nascimento", "Situação"]}
        rows={rows}
        emptyText="Nenhum aniversariante encontrado para o mês selecionado."
        renderRow={(p, i) => (
          <tr key={p.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Cake size={15} color={T.primary} /> {p.name}</span></td>
            <td style={reportCellStyle}>{p.phone}</td>
            <td style={reportCellStyle}>{p.nascimento}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={p.status === "Ativo" ? "success" : "muted"}>{p.status}</Pill></td>
          </tr>
        )}
      />
    </div>
  );
}

function ReportInativosRisco() {
  const { patients } = useAppData();
  const [threshold, setThreshold] = useState(30);
  const [applied, setApplied] = useState(30);

  const rows = patients
    .map((p) => ({ ...p, diasSemSessao: daysBetweenBr(p.lastSession) }))
    .filter((p) => p.status === "Inativo" || p.diasSemSessao >= applied)
    .sort((a, b) => b.diasSemSessao - a.diasSemSessao);

  return (
    <div>
      <FilterBar onApply={() => setApplied(threshold)}>
        <FilterField label="Risco a partir de (dias sem sessão)">
          <input type="number" min={1} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} style={{ ...filterInputStyle, minWidth: 100 }} />
        </FilterField>
      </FilterBar>

      <ReportTableCard
        countLabel={<>Pacientes inativos ou em risco: <strong>{rows.length}</strong></>}
        columns={["Paciente", "Situação", "Última sessão", "Dias sem sessão", "Classificação"]}
        rows={rows}
        emptyText="Nenhum paciente inativo ou em risco de abandono."
        renderRow={(p, i) => (
          <tr key={p.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{p.name}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={p.status === "Ativo" ? "success" : "muted"}>{p.status}</Pill></td>
            <td style={reportCellStyle}>{p.lastSession}</td>
            <td style={reportCellStyle}>{p.diasSemSessao}</td>
            <td style={{ padding: "14px 20px" }}>
              <Pill tone={p.status === "Inativo" ? "muted" : "warn"}>{p.status === "Inativo" ? "Inativo" : "Risco de abandono"}</Pill>
            </td>
          </tr>
        )}
      />
    </div>
  );
}

function ReportNovosCadastros() {
  const { patients } = useAppData();
  const defaultFrom = "17/08/2025";
  const defaultTo = "17/08/2026";
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [applied, setApplied] = useState({ from: defaultFrom, to: defaultTo });

  const from = parseBrDate(applied.from);
  const to = parseBrDate(applied.to);

  const rows = patients
    .filter((p) => {
      const d = parseBrDate(p.cadastro);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    })
    .sort((a, b) => parseBrDate(b.cadastro) - parseBrDate(a.cadastro));

  return (
    <div>
      <FilterBar onApply={() => setApplied({ from: dateFrom, to: dateTo })}>
        <FilterField label="Data inicial">
          <input value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="dd/mm/aaaa" style={{ ...filterInputStyle, minWidth: 130 }} />
        </FilterField>
        <FilterField label="Data final">
          <input value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="dd/mm/aaaa" style={{ ...filterInputStyle, minWidth: 130 }} />
        </FilterField>
      </FilterBar>

      <ReportTableCard
        countLabel={<>Novos cadastros no período: <strong>{rows.length}</strong></>}
        columns={["Paciente", "Data de cadastro", "Convênio", "Situação"]}
        rows={rows}
        emptyText="Nenhum cadastro novo no período selecionado."
        renderRow={(p, i) => (
          <tr key={p.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{p.name}</td>
            <td style={reportCellStyle}>{p.cadastro}</td>
            <td style={reportCellStyle}>{p.convenio || "—"}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={p.status === "Ativo" ? "success" : "muted"}>{p.status}</Pill></td>
          </tr>
        )}
      />
    </div>
  );
}

function ReportFaixaEtaria() {
  const { patients } = useAppData();
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [applied, setApplied] = useState("Todos");

  const base = patients.filter((p) => applied === "Todos" || p.status === applied);
  const chartData = AGE_BUCKETS.map((b) => ({
    label: b.label,
    value: base.filter((p) => { const a = ageFromBrDate(p.nascimento); return a != null && b.test(a); }).length,
  }));
  const total = base.length;

  return (
    <div>
      <FilterBar onApply={() => setApplied(statusFilter)}>
        <FilterField label="Situação do paciente">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...filterInputStyle, minWidth: 150 }}>
            {["Todos", "Ativo", "Inativo"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </FilterField>
      </FilterBar>

      <Card style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 14 }}>Distribuição por faixa etária</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#EEF1F8" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: T.muted }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: T.muted }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "rgba(76,111,255,0.06)" }} contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13 }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={T.primary} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <ReportTableCard
        countLabel={<>Total de pacientes: <strong>{total}</strong></>}
        columns={["Faixa etária", "Pacientes", "% do total"]}
        rows={chartData}
        emptyText="Nenhum paciente encontrado."
        renderRow={(b, i) => (
          <tr key={b.label} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{b.label}</td>
            <td style={reportCellStyle}>{b.value}</td>
            <td style={reportCellStyle}>{total ? Math.round((b.value / total) * 100) : 0}%</td>
          </tr>
        )}
      />
    </div>
  );
}

const GENDER_COLORS = [T.primary, "#F0A93A", "#1FAE6E", "#8A93AC"];

function ReportGenero() {
  const { patients } = useAppData();
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [applied, setApplied] = useState("Todos");

  const base = patients.filter((p) => applied === "Todos" || p.status === applied);
  const genders = Array.from(new Set(base.map((p) => p.genero || "Não informado")));
  const chartData = genders.map((g) => ({ name: g, value: base.filter((p) => (p.genero || "Não informado") === g).length }));
  const total = base.length;

  return (
    <div>
      <FilterBar onApply={() => setApplied(statusFilter)}>
        <FilterField label="Situação do paciente">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...filterInputStyle, minWidth: 150 }}>
            {["Todos", "Ativo", "Inativo"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </FilterField>
      </FilterBar>

      <Card style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>Distribuição por gênero</div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
              {chartData.map((d, i) => <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13 }} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap", marginTop: 6 }}>
          {chartData.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.muted }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: GENDER_COLORS[i % GENDER_COLORS.length] }} /> {d.name} ({d.value})
            </div>
          ))}
        </div>
      </Card>

      <ReportTableCard
        countLabel={<>Total de pacientes: <strong>{total}</strong></>}
        columns={["Gênero", "Pacientes", "% do total"]}
        rows={chartData}
        emptyText="Nenhum paciente encontrado."
        renderRow={(d, i) => (
          <tr key={d.name} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{d.name}</td>
            <td style={reportCellStyle}>{d.value}</td>
            <td style={reportCellStyle}>{total ? Math.round((d.value / total) * 100) : 0}%</td>
          </tr>
        )}
      />
    </div>
  );
}

/* Agenda --------------------------------------------------------------- */
function sessionStatusTone(status) {
  if (status === "Realizada") return "success";
  if (status === "Agendada") return "primary";
  if (status === "Falta") return "danger";
  return "warn"; // Cancelada
}

function ReportSessoesRealizadasAgendadas() {
  const defaultFrom = "01/07/2026";
  const defaultTo = "31/08/2026";
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [applied, setApplied] = useState({ from: defaultFrom, to: defaultTo });

  const from = parseBrDate(applied.from);
  const to = parseBrDate(applied.to);

  const rows = initialSessions
    .filter((s) => { const d = parseBrDate(s.data); return d && (!from || d >= from) && (!to || d <= to); })
    .sort((a, b) => parseBrDate(b.data) - parseBrDate(a.data));

  const counts = ["Realizada", "Agendada", "Falta", "Cancelada"].reduce((acc, st) => {
    acc[st] = rows.filter((s) => s.status === st).length;
    return acc;
  }, {});

  return (
    <div>
      <FilterBar onApply={() => setApplied({ from: dateFrom, to: dateTo })}>
        <FilterField label="Data inicial">
          <input value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="dd/mm/aaaa" style={{ ...filterInputStyle, minWidth: 130 }} />
        </FilterField>
        <FilterField label="Data final">
          <input value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="dd/mm/aaaa" style={{ ...filterInputStyle, minWidth: 130 }} />
        </FilterField>
      </FilterBar>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <MiniStat label="Realizadas" value={counts.Realizada} icon={Check} tone="success" />
        <MiniStat label="Agendadas" value={counts.Agendada} icon={CalendarClock} tone="primary" />
        <MiniStat label="Faltas" value={counts.Falta} icon={X} tone="danger" />
        <MiniStat label="Canceladas" value={counts.Cancelada} icon={RefreshCw} tone="danger" />
      </div>

      <ReportTableCard
        countLabel={<>Sessões no período: <strong>{rows.length}</strong></>}
        columns={["Data", "Paciente", "Status"]}
        rows={rows}
        emptyText="Nenhuma sessão encontrada no período selecionado."
        renderRow={(s, i) => (
          <tr key={s.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={reportCellStyle}>{s.data}</td>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{s.paciente}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={sessionStatusTone(s.status)}>{s.status}</Pill></td>
          </tr>
        )}
      />
    </div>
  );
}

function ReportFaltasCancelamentos() {
  const { patients } = useAppData();
  const defaultFrom = "01/06/2026";
  const defaultTo = "31/08/2026";
  const [patientFilter, setPatientFilter] = useState("Todos");
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [applied, setApplied] = useState({ patient: "Todos", from: defaultFrom, to: defaultTo });

  const from = parseBrDate(applied.from);
  const to = parseBrDate(applied.to);

  const rows = initialSessions
    .filter((s) => s.status === "Falta" || s.status === "Cancelada")
    .filter((s) => applied.patient === "Todos" || s.paciente === applied.patient)
    .filter((s) => { const d = parseBrDate(s.data); return d && (!from || d >= from) && (!to || d <= to); })
    .sort((a, b) => parseBrDate(b.data) - parseBrDate(a.data));

  const faltas = rows.filter((s) => s.status === "Falta").length;
  const cancelamentos = rows.filter((s) => s.status === "Cancelada").length;

  return (
    <div>
      <FilterBar onApply={() => setApplied({ patient: patientFilter, from: dateFrom, to: dateTo })}>
        <FilterField label="Paciente">
          <select value={patientFilter} onChange={(e) => setPatientFilter(e.target.value)} style={{ ...filterInputStyle, minWidth: 170 }}>
            <option>Todos</option>
            {patients.map((p) => <option key={p.id}>{p.name}</option>)}
          </select>
        </FilterField>
        <FilterField label="Data inicial">
          <input value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="dd/mm/aaaa" style={{ ...filterInputStyle, minWidth: 130 }} />
        </FilterField>
        <FilterField label="Data final">
          <input value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="dd/mm/aaaa" style={{ ...filterInputStyle, minWidth: 130 }} />
        </FilterField>
      </FilterBar>

      <ReportTableCard
        countLabel={<>Faltas: <strong>{faltas}</strong> &nbsp;·&nbsp; Cancelamentos: <strong>{cancelamentos}</strong></>}
        columns={["Data", "Paciente", "Status"]}
        rows={rows}
        emptyText="Nenhuma falta ou cancelamento encontrado para os filtros selecionados."
        renderRow={(s, i) => (
          <tr key={s.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={reportCellStyle}>{s.data}</td>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{s.paciente}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={sessionStatusTone(s.status)}>{s.status}</Pill></td>
          </tr>
        )}
      />
    </div>
  );
}

function ReportFrequencia() {
  const patientNames = Array.from(new Set(initialSessions.map((s) => s.paciente)));

  const rows = patientNames.map((name) => {
    const realized = initialSessions
      .filter((s) => s.paciente === name && s.status === "Realizada")
      .map((s) => parseBrDate(s.data))
      .sort((a, b) => a - b);
    let avgInterval = null;
    if (realized.length > 1) {
      const diffs = realized.slice(1).map((d, i) => Math.round((d - realized[i]) / 86400000));
      avgInterval = Math.round(diffs.reduce((s, v) => s + v, 0) / diffs.length);
    }
    return {
      name,
      count: realized.length,
      avgInterval,
      last: realized.length ? realized[realized.length - 1].toLocaleDateString("pt-BR") : "—",
    };
  }).sort((a, b) => b.count - a.count);

  return (
    <ReportTableCard
      countLabel={<>Pacientes com sessões realizadas: <strong>{rows.length}</strong></>}
      columns={["Paciente", "Sessões realizadas", "Intervalo médio", "Última sessão realizada"]}
      rows={rows}
      emptyText="Nenhuma sessão realizada encontrada."
      renderRow={(r, i) => (
        <tr key={r.name} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
          <td style={{ ...reportCellStyle, fontWeight: 600 }}>{r.name}</td>
          <td style={reportCellStyle}>{r.count}</td>
          <td style={reportCellStyle}>{r.avgInterval != null ? `${r.avgInterval} dias` : "—"}</td>
          <td style={reportCellStyle}>{r.last}</td>
        </tr>
      )}
    />
  );
}

function ReportOcupacao() {
  const offsets = Object.keys(weekSchedules).map(Number).sort((a, b) => a - b);
  const rows = offsets.map((offset) => {
    const events = weekSchedules[offset];
    const preenchidos = events.length;
    const livres = Math.max(HOURS.length - preenchidos, 0);
    const pct = Math.round((preenchidos / HOURS.length) * 100);
    return { offset, label: WEEKDAY_FULL[weekdayIndex(offset)], preenchidos, livres, pct };
  });

  return (
    <ReportTableCard
      countLabel={<>Dias analisados: <strong>{rows.length}</strong></>}
      columns={["Dia", "Horários preenchidos", "Horários livres", "Ocupação"]}
      rows={rows}
      emptyText="Nenhum dado de agenda disponível."
      renderRow={(r, i) => (
        <tr key={r.offset} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
          <td style={{ ...reportCellStyle, fontWeight: 600 }}>{r.label}</td>
          <td style={reportCellStyle}>{r.preenchidos} / {HOURS.length}</td>
          <td style={reportCellStyle}>{r.livres}</td>
          <td style={{ padding: "14px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 90, height: 8, borderRadius: 999, background: T.primaryTint, overflow: "hidden" }}>
                <div style={{ width: `${r.pct}%`, height: "100%", background: T.primary, borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{r.pct}%</span>
            </div>
          </td>
        </tr>
      )}
    />
  );
}

/* Financeiro ------------------------------------------------------------ */
function ReportContasReceber() {
  const { receivables } = useAppData();
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [applied, setApplied] = useState("Todos");

  const rows = receivables.filter((r) => applied === "Todos" || r.status === applied);
  const total = rows.reduce((s, r) => s + r.valor, 0);

  return (
    <div>
      <FilterBar onApply={() => setApplied(statusFilter)}>
        <FilterField label="Status">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...filterInputStyle, minWidth: 150 }}>
            {["Todos", "Pago", "Pendente", "Atrasado"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </FilterField>
      </FilterBar>

      <ReportTableCard
        countLabel={<>Total: <strong>R$ {total.toLocaleString("pt-BR")}</strong> &nbsp;·&nbsp; {rows.length} lançamento(s)</>}
        columns={["Paciente", "Referência", "Valor", "Vencimento", "Status"]}
        rows={rows}
        emptyText="Nenhuma conta a receber encontrada."
        renderRow={(r, i) => (
          <tr key={r.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{r.paciente}</td>
            <td style={reportCellStyle}>{r.referencia}</td>
            <td style={reportCellStyle}>R$ {r.valor.toLocaleString("pt-BR")}</td>
            <td style={reportCellStyle}>{r.vencimento}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={statusTone(r.status)}>{r.status}</Pill></td>
          </tr>
        )}
      />
    </div>
  );
}

function ReportContasPagar() {
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [applied, setApplied] = useState("Todos");

  const rows = initialPayables.filter((p) => applied === "Todos" || p.status === applied);
  const total = rows.reduce((s, p) => s + p.valor, 0);

  return (
    <div>
      <FilterBar onApply={() => setApplied(statusFilter)}>
        <FilterField label="Status">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...filterInputStyle, minWidth: 150 }}>
            {["Todos", "Pago", "Pendente", "Atrasado"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </FilterField>
      </FilterBar>

      <ReportTableCard
        countLabel={<>Total: <strong>R$ {total.toLocaleString("pt-BR")}</strong> &nbsp;·&nbsp; {rows.length} lançamento(s)</>}
        columns={["Descrição", "Categoria", "Valor", "Vencimento", "Status"]}
        rows={rows}
        emptyText="Nenhuma conta a pagar encontrada."
        renderRow={(p, i) => (
          <tr key={p.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{p.descricao}</td>
            <td style={reportCellStyle}>{p.categoria}</td>
            <td style={reportCellStyle}>R$ {p.valor.toLocaleString("pt-BR")}</td>
            <td style={reportCellStyle}>{p.vencimento}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={statusTone(p.status)}>{p.status}</Pill></td>
          </tr>
        )}
      />
    </div>
  );
}

function ReportInadimplencia() {
  const { receivables } = useAppData();
  const rows = receivables
    .filter((r) => r.status !== "Pago" && (r.status === "Atrasado" || parseBrDate(r.vencimento) < REPORT_TODAY))
    .map((r) => ({ ...r, diasAtraso: Math.max(daysBetweenBr(r.vencimento), 0) }))
    .sort((a, b) => b.diasAtraso - a.diasAtraso);

  const total = rows.reduce((s, r) => s + r.valor, 0);

  return (
    <ReportTableCard
      countLabel={<>Total em atraso: <strong>R$ {total.toLocaleString("pt-BR")}</strong> &nbsp;·&nbsp; {rows.length} cobrança(s)</>}
      columns={["Paciente", "Referência", "Valor", "Vencimento", "Dias em atraso"]}
      rows={rows}
      emptyText="Nenhuma cobrança em atraso."
      renderRow={(r, i) => (
        <tr key={r.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
          <td style={{ ...reportCellStyle, fontWeight: 600 }}>{r.paciente}</td>
          <td style={reportCellStyle}>{r.referencia}</td>
          <td style={reportCellStyle}>R$ {r.valor.toLocaleString("pt-BR")}</td>
          <td style={reportCellStyle}>{r.vencimento}</td>
          <td style={{ padding: "14px 20px" }}><Pill tone="danger">{r.diasAtraso} dias</Pill></td>
        </tr>
      )}
    />
  );
}

function ReportRecebimentoPaciente() {
  const { receivables } = useAppData();
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");

  const names = Array.from(new Set(receivables.map((r) => r.paciente)));
  const rows = names
    .map((name) => {
      const paid = receivables.filter((r) => r.paciente === name && r.status === "Pago");
      const total = paid.reduce((s, r) => s + r.valor, 0);
      return { name, total, count: paid.length };
    })
    .filter((r) => r.count > 0)
    .filter((r) => !applied || r.name.toLowerCase().includes(applied.toLowerCase()))
    .sort((a, b) => b.total - a.total);

  const total = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div>
      <FilterBar onApply={() => setApplied(query)}>
        <FilterField label="Paciente">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome" style={filterInputStyle} />
        </FilterField>
      </FilterBar>

      <ReportTableCard
        countLabel={<>Total recebido: <strong>R$ {total.toLocaleString("pt-BR")}</strong></>}
        columns={["Paciente", "Cobranças pagas", "Total recebido"]}
        rows={rows}
        emptyText="Nenhum recebimento encontrado para o paciente pesquisado."
        renderRow={(r, i) => (
          <tr key={r.name} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{r.name}</td>
            <td style={reportCellStyle}>{r.count}</td>
            <td style={reportCellStyle}>R$ {r.total.toLocaleString("pt-BR")}</td>
          </tr>
        )}
      />
    </div>
  );
}

/* Clínico ---------------------------------------------------------------- */
function mostRecentBrDate(dates) {
  const parsed = dates.map(parseBrDate).filter(Boolean);
  if (!parsed.length) return null;
  return new Date(Math.max(...parsed.map((d) => d.getTime())));
}

function ReportComAnamnese() {
  const { patients, anamneses } = useAppData();
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [applied, setApplied] = useState("Todos");

  const rows = patients
    .map((p) => ({ ...p, anamneseList: anamneses[p.id] || [] }))
    .filter((p) => p.anamneseList.length > 0)
    .filter((p) => applied === "Todos" || p.status === applied)
    .map((p) => ({ ...p, ultimaAnamnese: mostRecentBrDate(p.anamneseList.map((a) => a.preenchidoEm)) }))
    .sort((a, b) => (b.ultimaAnamnese?.getTime() || 0) - (a.ultimaAnamnese?.getTime() || 0));

  return (
    <div>
      <FilterBar onApply={() => setApplied(statusFilter)}>
        <FilterField label="Situação do paciente">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...filterInputStyle, minWidth: 150 }}>
            {["Todos", "Ativo", "Inativo"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </FilterField>
      </FilterBar>

      <ReportTableCard
        countLabel={<>Pacientes com anamnese: <strong>{rows.length}</strong></>}
        columns={["Paciente", "Convênio", "Nº de anamneses", "Última anamnese", "Situação"]}
        rows={rows}
        emptyText="Nenhum paciente com anamnese preenchida."
        renderRow={(p, i) => (
          <tr key={p.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{p.name}</td>
            <td style={reportCellStyle}>{p.convenio || "—"}</td>
            <td style={reportCellStyle}>{p.anamneseList.length}</td>
            <td style={reportCellStyle}>{p.ultimaAnamnese ? p.ultimaAnamnese.toLocaleDateString("pt-BR") : "—"}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={p.status === "Ativo" ? "success" : "muted"}>{p.status}</Pill></td>
          </tr>
        )}
      />
    </div>
  );
}

function ReportSemAnamnese() {
  const { patients, anamneses } = useAppData();
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [applied, setApplied] = useState("Todos");

  const rows = patients
    .filter((p) => (anamneses[p.id] || []).length === 0)
    .filter((p) => applied === "Todos" || p.status === applied);

  return (
    <div>
      <FilterBar onApply={() => setApplied(statusFilter)}>
        <FilterField label="Situação do paciente">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...filterInputStyle, minWidth: 150 }}>
            {["Todos", "Ativo", "Inativo"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </FilterField>
      </FilterBar>

      <ReportTableCard
        countLabel={<>Pacientes sem anamnese: <strong>{rows.length}</strong></>}
        columns={["Paciente", "Convênio", "Última sessão", "Situação"]}
        rows={rows}
        emptyText="Todos os pacientes já têm anamnese preenchida."
        renderRow={(p, i) => (
          <tr key={p.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{p.name}</td>
            <td style={reportCellStyle}>{p.convenio || "—"}</td>
            <td style={reportCellStyle}>{p.lastSession}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={p.status === "Ativo" ? "success" : "muted"}>{p.status}</Pill></td>
          </tr>
        )}
      />
    </div>
  );
}

function ReportComProntuario() {
  const { patients, records } = useAppData();
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [applied, setApplied] = useState("Todos");

  const rows = patients
    .map((p) => ({ ...p, recordList: records[p.id] || [] }))
    .filter((p) => p.recordList.length > 0)
    .filter((p) => applied === "Todos" || p.status === applied)
    .map((p) => ({ ...p, ultimoRegistro: mostRecentBrDate(p.recordList.map((r) => r.date)) }))
    .sort((a, b) => (b.ultimoRegistro?.getTime() || 0) - (a.ultimoRegistro?.getTime() || 0));

  return (
    <div>
      <FilterBar onApply={() => setApplied(statusFilter)}>
        <FilterField label="Situação do paciente">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...filterInputStyle, minWidth: 150 }}>
            {["Todos", "Ativo", "Inativo"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </FilterField>
      </FilterBar>

      <ReportTableCard
        countLabel={<>Pacientes com prontuários: <strong>{rows.length}</strong></>}
        columns={["Paciente", "Convênio", "Nº de registros", "Último registro", "Situação"]}
        rows={rows}
        emptyText="Nenhum paciente com registros no prontuário."
        renderRow={(p, i) => (
          <tr key={p.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{p.name}</td>
            <td style={reportCellStyle}>{p.convenio || "—"}</td>
            <td style={reportCellStyle}>{p.recordList.length}</td>
            <td style={reportCellStyle}>{p.ultimoRegistro ? p.ultimoRegistro.toLocaleDateString("pt-BR") : "—"}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={p.status === "Ativo" ? "success" : "muted"}>{p.status}</Pill></td>
          </tr>
        )}
      />
    </div>
  );
}

function ReportSemProntuario() {
  const { patients, records } = useAppData();
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [applied, setApplied] = useState("Todos");

  const rows = patients
    .filter((p) => (records[p.id] || []).length === 0)
    .filter((p) => applied === "Todos" || p.status === applied);

  return (
    <div>
      <FilterBar onApply={() => setApplied(statusFilter)}>
        <FilterField label="Situação do paciente">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...filterInputStyle, minWidth: 150 }}>
            {["Todos", "Ativo", "Inativo"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </FilterField>
      </FilterBar>

      <ReportTableCard
        countLabel={<>Pacientes sem prontuários: <strong>{rows.length}</strong></>}
        columns={["Paciente", "Convênio", "Última sessão", "Situação"]}
        rows={rows}
        emptyText="Todos os pacientes já têm registros no prontuário."
        renderRow={(p, i) => (
          <tr key={p.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{p.name}</td>
            <td style={reportCellStyle}>{p.convenio || "—"}</td>
            <td style={reportCellStyle}>{p.lastSession}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={p.status === "Ativo" ? "success" : "muted"}>{p.status}</Pill></td>
          </tr>
        )}
      />
    </div>
  );
}

/* Hub + navegação --------------------------------------------------------- */
const REPORT_COMPONENTS = {
  lista: ReportListaPacientes,
  aniversariantes: ReportAniversariantes,
  inativos: ReportInativosRisco,
  novos: ReportNovosCadastros,
  "faixa-etaria": ReportFaixaEtaria,
  genero: ReportGenero,
  "realizadas-agendadas": ReportSessoesRealizadasAgendadas,
  "faltas-cancelamentos": ReportFaltasCancelamentos,
  frequencia: ReportFrequencia,
  ocupacao: ReportOcupacao,
  receber: ReportContasReceber,
  pagar: ReportContasPagar,
  inadimplencia: ReportInadimplencia,
  "recebimento-paciente": ReportRecebimentoPaciente,
  "com-anamnese": ReportComAnamnese,
  "sem-anamnese": ReportSemAnamnese,
  "com-prontuario": ReportComProntuario,
  "sem-prontuario": ReportSemProntuario,
};

function CategoryIllustration({ icon: Icon, badgeIcon: BadgeIcon, accent, accentTint }) {
  return (
    <div style={{ position: "absolute", right: 0, bottom: 0, width: 220, height: 220, pointerEvents: "none" }}>
      <div style={{ position: "absolute", right: -40, bottom: -40, width: 220, height: 220, borderRadius: "50%", background: accentTint, opacity: 0.6 }} />
      <div style={{ position: "absolute", right: 30, bottom: 34, width: 100, height: 100, borderRadius: 24, background: "#fff", boxShadow: "0 14px 30px rgba(28,34,51,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={42} color={accent} />
      </div>
      <div style={{ position: "absolute", right: 20, bottom: 124, width: 44, height: 44, borderRadius: "50%", background: "#fff", boxShadow: "0 8px 18px rgba(28,34,51,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BadgeIcon size={20} color={accent} />
      </div>
    </div>
  );
}

function RelatoriosHub({ onSelect }) {
  return (
    <div>
      <PageHeader title="Relatórios" subtitle="A sua gestão em um só lugar." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
        {REPORT_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card key={cat.key} style={{ padding: 0, overflow: "hidden", position: "relative", minHeight: 260, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "32px 32px 28px", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ width: 54, height: 54, borderRadius: "50%", background: cat.accentTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  <Icon size={26} color={cat.accent} />
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: cat.accent, marginBottom: 8 }}>{cat.label}</div>
                <p style={{ color: T.muted, fontSize: 14.5, lineHeight: 1.6, margin: "0 0 22px", maxWidth: 260 }}>{cat.subtitle}</p>
                <button
                  onClick={() => onSelect(cat.key)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, background: cat.accentTint, color: cat.accent, border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: "auto", alignSelf: "flex-start" }}
                >
                  Acessar relatório <ChevronRight size={16} />
                </button>
              </div>
              <CategoryIllustration icon={cat.icon} badgeIcon={cat.badgeIcon} accent={cat.accent} accentTint={cat.accentTint} />
              <div style={{ height: 5, background: cat.accent }} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function CategoryReportList({ category, onBack, onSelectReport }) {
  return (
    <div>
      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: T.muted, fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 14, padding: 0 }}
      >
        <ArrowLeft size={16} /> Voltar para Relatórios
      </button>
      <PageHeader title={`Relatórios de ${category.label.toLowerCase()}`} subtitle={category.subtitle} />
      <Card style={{ padding: "4px 24px" }}>
        {category.reports.map((r, i) => (
          <div
            key={r.key}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 0", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}
          >
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: T.text }}>{r.label}</div>
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>{r.desc}</div>
            </div>
            <button
              onClick={() => onSelectReport(r.key)}
              style={{ background: "none", border: "none", color: category.accent, fontWeight: 700, fontSize: 12.5, letterSpacing: 0.3, textTransform: "uppercase", cursor: "pointer", flexShrink: 0 }}
            >
              Visualizar
            </button>
          </div>
        ))}
      </Card>
    </div>
  );
}

function Relatorios() {
  const [categoryKey, setCategoryKey] = useState(null);
  const [reportKey, setReportKey] = useState(null);

  const category = REPORT_CATEGORIES.find((c) => c.key === categoryKey);

  if (!category) {
    return <RelatoriosHub onSelect={(k) => setCategoryKey(k)} />;
  }

  if (!reportKey) {
    return (
      <CategoryReportList
        category={category}
        onBack={() => setCategoryKey(null)}
        onSelectReport={(k) => setReportKey(k)}
      />
    );
  }

  const report = category.reports.find((r) => r.key === reportKey);
  const ReportComponent = REPORT_COMPONENTS[reportKey];

  return (
    <div>
      <button
        onClick={() => setReportKey(null)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: T.muted, fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 14, padding: 0 }}
      >
        <ArrowLeft size={16} /> Voltar para relatórios de {category.label.toLowerCase()}
      </button>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color: T.text, margin: 0 }}>{report ? report.label : ""}</h1>
        <p style={{ color: T.muted, fontSize: 14, marginTop: 4 }}>{report ? report.desc : ""}</p>
      </div>
      {ReportComponent && <ReportComponent />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Financeiro                                                           */
/* ------------------------------------------------------------------ */
function statusTone(status) {
  if (status === "Pago") return "success";
  if (status === "Pendente") return "warn";
  return "danger"; // Atrasado
}

function NewReceivableModal({ onClose, onSave, defaultPatientName }) {
  const { patients } = useAppData();
  const [form, setForm] = useState({ paciente: defaultPatientName || patients[0].name, referencia: "Mensalidade — Agosto/2026", valor: 800, vencimento: "20/08/2026", status: "Pendente" });
  return (
    <Modal title="Nova conta a receber" onClose={onClose} width={380}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Paciente (pagante)</label>
      <select value={form.paciente} onChange={(e) => setForm({ ...form, paciente: e.target.value })} style={inputStyle}>
        {patients.map((p) => <option key={p.id}>{p.name}</option>)}
      </select>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Referência</label>
      <input value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} style={inputStyle} />

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Valor (R$)</label>
      <input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} style={inputStyle} />

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Vencimento</label>
      <input value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} placeholder="dd/mm/aaaa" style={inputStyle} />

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Status</label>
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
        <option>Pago</option>
        <option>Pendente</option>
        <option>Atrasado</option>
      </select>

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={() => onSave({ ...form, valor: Number(form.valor) })}>Adicionar</PrimaryButton>
      </div>
    </Modal>
  );
}

function NewPayableModal({ onClose, onSave }) {
  const [form, setForm] = useState({ descricao: "", categoria: "Estrutura", valor: 100, vencimento: "25/08/2026", status: "Pendente" });
  return (
    <Modal title="Nova conta a pagar" onClose={onClose} width={380}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Descrição</label>
      <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Internet do consultório" style={inputStyle} />

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Categoria</label>
      <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} style={inputStyle}>
        {PAYABLE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </select>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Valor (R$)</label>
      <input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} style={inputStyle} />

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Vencimento</label>
      <input value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} placeholder="dd/mm/aaaa" style={inputStyle} />

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Status</label>
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
        <option>Pago</option>
        <option>Pendente</option>
        <option>Atrasado</option>
      </select>

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton
          style={{ flex: 1, justifyContent: "center" }}
          onClick={() => form.descricao.trim() && onSave({ ...form, valor: Number(form.valor) })}
        >
          Adicionar
        </PrimaryButton>
      </div>
    </Modal>
  );
}

function Financeiro() {
  const { receivables, addReceivable } = useAppData();
  const [tab, setTab] = useState("receber"); // 'receber' | 'pagar'
  const [payables, setPayables] = useState(initialPayables);
  const [showReceivableModal, setShowReceivableModal] = useState(false);
  const [showPayableModal, setShowPayableModal] = useState(false);

  const totalReceber = receivables.reduce((s, r) => s + r.valor, 0);
  const recebido = receivables.filter((r) => r.status === "Pago").reduce((s, r) => s + r.valor, 0);
  const pendenteReceber = receivables.filter((r) => r.status === "Pendente").reduce((s, r) => s + r.valor, 0);
  const atrasadoReceber = receivables.filter((r) => r.status === "Atrasado").reduce((s, r) => s + r.valor, 0);

  const totalPagar = payables.reduce((s, p) => s + p.valor, 0);
  const pago = payables.filter((p) => p.status === "Pago").reduce((s, p) => s + p.valor, 0);
  const pendentePagar = payables.filter((p) => p.status === "Pendente").reduce((s, p) => s + p.valor, 0);

  return (
    <div>
      <PageHeader
        title="Financeiro"
        subtitle="Controle contas a receber e contas a pagar"
        action={
          tab === "receber"
            ? <PrimaryButton icon={Plus} onClick={() => setShowReceivableModal(true)}>Nova conta a receber</PrimaryButton>
            : <PrimaryButton icon={Plus} onClick={() => setShowPayableModal(true)}>Nova conta a pagar</PrimaryButton>
        }
      />

      {/* Segmented tab control */}
      <div style={{ display: "inline-flex", background: "#EEF1F8", borderRadius: 12, padding: 4, marginBottom: 20, gap: 4 }}>
        <button
          onClick={() => setTab("receber")}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 9, border: "none",
            cursor: "pointer", fontSize: 14, fontWeight: 700, background: tab === "receber" ? "#fff" : "transparent",
            color: tab === "receber" ? T.primaryDark : T.muted, boxShadow: tab === "receber" ? "0 1px 3px rgba(28,34,51,0.08)" : "none",
          }}
        >
          <ArrowDownCircle size={19} /> Contas a receber
        </button>
        <button
          onClick={() => setTab("pagar")}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 9, border: "none",
            cursor: "pointer", fontSize: 14, fontWeight: 700, background: tab === "pagar" ? "#fff" : "transparent",
            color: tab === "pagar" ? T.primaryDark : T.muted, boxShadow: tab === "pagar" ? "0 1px 3px rgba(28,34,51,0.08)" : "none",
          }}
        >
          <ArrowUpCircle size={19} /> Contas a pagar
        </button>
      </div>

      {tab === "receber" ? (
        <div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <StatCard label="Total a receber" value={`R$ ${totalReceber.toLocaleString("pt-BR")}`} delta={`${receivables.length} lançamentos`} icon={CircleDollarSign} />
            <StatCard label="Recebido no mês" value={`R$ ${recebido.toLocaleString("pt-BR")}`} delta="Pago" icon={TrendingUp} />
            <StatCard label="Pendente" value={`R$ ${pendenteReceber.toLocaleString("pt-BR")}`} delta="A vencer" deltaTone="danger" icon={Clock} />
            <StatCard label="Atrasado" value={`R$ ${atrasadoReceber.toLocaleString("pt-BR")}`} delta="Requer cobrança" deltaTone="danger" icon={TrendingDown} />
          </div>

          <Card style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", fontWeight: 700, fontSize: 15, color: T.text, borderBottom: `1px solid ${T.border}` }}>
              Mensalidades dos pacientes
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFBFE", textAlign: "left" }}>
                  {["Paciente", "Referência", "Valor", "Vencimento", "Status"].map((h) => (
                    <th key={h} style={{ padding: "10px 20px", fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receivables.map((r, i) => (
                  <tr key={r.id} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: "12px 20px", fontSize: 13.5, fontWeight: 600, color: T.text }}>{r.paciente}</td>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: T.muted }}>{r.referencia}</td>
                    <td style={{ padding: "12px 20px", fontSize: 13.5, fontWeight: 700, color: T.success }}>R$ {r.valor.toLocaleString("pt-BR")}</td>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: T.text }}>{r.vencimento}</td>
                    <td style={{ padding: "12px 20px" }}><Pill tone={statusTone(r.status)}>{r.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <StatCard label="Total a pagar" value={`R$ ${totalPagar.toLocaleString("pt-BR")}`} delta={`${payables.length} lançamentos`} icon={CircleDollarSign} />
            <StatCard label="Pago no mês" value={`R$ ${pago.toLocaleString("pt-BR")}`} delta="Quitado" icon={TrendingUp} />
            <StatCard label="Pendente" value={`R$ ${pendentePagar.toLocaleString("pt-BR")}`} delta="A vencer" deltaTone="danger" icon={Clock} />
            <StatCard label="Saldo do mês" value={`R$ ${(recebido - pago).toLocaleString("pt-BR")}`} delta="Receber − Pagar" icon={Wallet} />
          </div>

          <Card style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", fontWeight: 700, fontSize: 15, color: T.text, borderBottom: `1px solid ${T.border}` }}>
              Despesas do consultório
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFBFE", textAlign: "left" }}>
                  {["Descrição", "Categoria", "Valor", "Vencimento", "Status"].map((h) => (
                    <th key={h} style={{ padding: "10px 20px", fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payables.map((p) => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: "12px 20px", fontSize: 13.5, fontWeight: 600, color: T.text }}>{p.descricao}</td>
                    <td style={{ padding: "12px 20px" }}><Pill tone="muted">{p.categoria}</Pill></td>
                    <td style={{ padding: "12px 20px", fontSize: 13.5, fontWeight: 700, color: T.danger }}>R$ {p.valor.toLocaleString("pt-BR")}</td>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: T.text }}>{p.vencimento}</td>
                    <td style={{ padding: "12px 20px" }}><Pill tone={statusTone(p.status)}>{p.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {showReceivableModal && (
        <NewReceivableModal
          onClose={() => setShowReceivableModal(false)}
          onSave={(entry) => {
            addReceivable(entry);
            setShowReceivableModal(false);
          }}
        />
      )}
      {showPayableModal && (
        <NewPayableModal
          onClose={() => setShowPayableModal(false)}
          onSave={(entry) => {
            setPayables((prev) => [{ id: Date.now(), ...entry }, ...prev]);
            setShowPayableModal(false);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Declarações                                                          */
/* ------------------------------------------------------------------ */
function GenerateDeclarationModal({ template, onClose, onGenerate }) {
  const { patients } = useAppData();
  const [patientId, setPatientId] = useState(patients[0].id);
  const [values, setValues] = useState(() => Object.fromEntries(template.fields.map((f) => [f.key, f.default])));
  const patient = patients.find((p) => p.id === patientId);

  return (
    <Modal title={template.title} onClose={onClose} width={420}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Paciente</label>
      <select value={patientId} onChange={(e) => setPatientId(Number(e.target.value))} style={inputStyle}>
        {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {template.fields.map((f) => (
        <div key={f.key}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>{f.label}</label>
          {f.type === "select" ? (
            <select value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} style={inputStyle}>
              {f.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          ) : (
            <input
              type={f.type}
              value={values[f.key]}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              style={inputStyle}
            />
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={() => onGenerate(patient, values)}>Gerar documento</PrimaryButton>
      </div>
    </Modal>
  );
}

function DeclarationDocumentModal({ template, patient, values, onClose, onPrint }) {
  const paragraphs = template.build(patient, values, todayLabel());
  const [copied, setCopied] = useState(false);

  function copyText() {
    const text = paragraphs.join("\n\n");
    try {
      navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {}
  }

  return (
    <Modal title="Documento gerado" onClose={onClose} width={560}>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "28px 26px", background: "#FDFDFE" }}>
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15, marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{template.title.toUpperCase()}</div>
        <div style={{ height: 2, width: 46, background: T.primary, margin: "6px auto 20px", borderRadius: 2 }} />
        {paragraphs.map((p, i) => (
          <p key={i} style={{ fontSize: 13.5, lineHeight: 1.8, color: T.text, marginBottom: 14, textAlign: "justify" }}>{p}</p>
        ))}
        <p style={{ fontSize: 13.5, color: T.text, marginTop: 26 }}>Criciúma, {todayLabel()}.</p>
        <div style={{ marginTop: 34, textAlign: "center" }}>
          <div style={{ borderTop: `1px solid ${T.text}`, width: 240, margin: "0 auto 6px" }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Dra. Isadora Talamini</div>
          <div style={{ fontSize: 12, color: T.muted }}>Psicóloga · CRP 12/34567</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={copyText} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13.5 }}>
          <Copy size={18} /> {copied ? "Copiado!" : "Copiar texto"}
        </button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Printer} onClick={() => onPrint(template, paragraphs)}>
          Imprimir / Baixar PDF
        </PrimaryButton>
      </div>
    </Modal>
  );
}

function Declaracoes({ setPrintContent }) {
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [generated, setGenerated] = useState(null); // { template, patient, values }

  return (
    <div>
      <PageHeader title="Declarações" subtitle="Modelos prontos de atestados, declarações e recibos" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
        {DECLARATION_TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.id} style={{ padding: 0, overflow: "hidden", position: "relative", minHeight: 260, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "32px 32px 28px", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ width: 54, height: 54, borderRadius: "50%", background: t.accentTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  <Icon size={26} color={t.accent} />
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 20, color: t.accent, marginBottom: 8 }}>{t.title}</div>
                <p style={{ color: T.muted, fontSize: 14.5, lineHeight: 1.6, margin: "0 0 22px", maxWidth: 320 }}>{t.desc}</p>
                <button
                  onClick={() => setActiveTemplate(t)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8, background: t.accentTint, color: t.accent,
                    border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                    marginTop: "auto", alignSelf: "flex-start",
                  }}
                >
                  <FileSignature size={16} /> Gerar declaração
                </button>
              </div>
              <CategoryIllustration icon={t.icon} badgeIcon={t.badgeIcon} accent={t.accent} accentTint={t.accentTint} />
              <div style={{ height: 5, background: t.accent }} />
            </Card>
          );
        })}
      </div>

      {activeTemplate && !generated && (
        <GenerateDeclarationModal
          template={activeTemplate}
          onClose={() => setActiveTemplate(null)}
          onGenerate={(patient, values) => setGenerated({ template: activeTemplate, patient, values })}
        />
      )}

      {generated && (
        <DeclarationDocumentModal
          template={generated.template}
          patient={generated.patient}
          values={generated.values}
          onClose={() => { setGenerated(null); setActiveTemplate(null); }}
          onPrint={(template, paragraphs) => {
            setPrintContent({ template, patient: generated.patient, paragraphs });
            setTimeout(() => window.print(), 50);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Configurações                                                        */
/* ------------------------------------------------------------------ */
function SettingsSection({ title, children }) {
  return (
    <Card style={{ padding: 28, marginBottom: 18, flex: "1 1 auto", minHeight: 220 }}>
      <div style={{ fontWeight: 800, fontSize: 19, color: T.text, marginBottom: 20 }}>{title}</div>
      {children}
    </Card>
  );
}

const settingsLabelStyle = { fontSize: 14, fontWeight: 700, color: T.muted, display: "block", marginBottom: 8 };
const settingsInputStyle = { ...inputStyle, margin: 0, fontSize: 15.5, padding: "12px 14px" };

function Field({ label, defaultValue, type = "text" }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={settingsLabelStyle}>{label}</label>
      <input type={type} defaultValue={defaultValue} style={settingsInputStyle} />
    </div>
  );
}

function GoalField({ label, value, onChange, prefix }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={settingsLabelStyle}>{label}</label>
      <div style={{ position: "relative" }}>
        {prefix && (
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15.5, color: T.muted }}>{prefix}</span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ ...settingsInputStyle, paddingLeft: prefix ? 32 : 14 }}
        />
      </div>
    </div>
  );
}

function MetasTab() {
  const { goals, updateGoals } = useAppData();
  return (
    <SettingsSection title="Metas do consultório">
      <div style={{ fontSize: 14, color: T.muted, marginBottom: 20, maxWidth: 520 }}>
        Essas metas alimentam os indicadores do Dashboard (como "Faturamento no mês" e "Horas na semana"), mostrando se você está no caminho certo.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <GoalField label="Meta de faturamento mensal" value={goals.faturamentoMensal} onChange={(v) => updateGoals({ faturamentoMensal: v })} prefix="R$" />
        <GoalField label="Meta de horas semanais" value={goals.horasSemanais} onChange={(v) => updateGoals({ horasSemanais: v })} />
        <GoalField label="Meta de sessões semanais" value={goals.sessoesSemanais} onChange={(v) => updateGoals({ sessoesSemanais: v })} />
        <GoalField label="Meta de novos pacientes / mês" value={goals.novosPacientesMes} onChange={(v) => updateGoals({ novosPacientesMes: v })} />
      </div>
    </SettingsSection>
  );
}

function WhatsappTab() {
  const [enabled, setEnabled] = useState(true);
  const [numero, setNumero] = useState("(48) 99876-5432");
  const [diasAntes, setDiasAntes] = useState(2);
  const [mensagemLembrete, setMensagemLembrete] = useState(
    "Olá {paciente}! Passando para lembrar que sua sessão está confirmada para {data} às {hora}. Até lá!"
  );
  const [mensagemCobranca, setMensagemCobranca] = useState(
    "Olá {paciente}, tudo bem? Sua mensalidade de {referencia} no valor de {valor} vence em {vencimento}. Qualquer dúvida, estou à disposição!"
  );

  return (
    <>
      <SettingsSection title="Envio automático">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 0 22px" }}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: T.text }}>Enviar cobranças e lembretes via WhatsApp</div>
            <div style={{ fontSize: 13.5, color: T.muted, marginTop: 3, maxWidth: 420 }}>Ativa o envio automático das mensagens configuradas abaixo para os pacientes.</div>
          </div>
          <Switch checked={enabled} onChange={setEnabled} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Field label="Número do WhatsApp comercial" defaultValue={numero} />
          <GoalField label="Enviar cobrança X dias antes do vencimento" value={diasAntes} onChange={setDiasAntes} />
        </div>
      </SettingsSection>

      <SettingsSection title="Mensagem de lembrete de sessão">
        <textarea
          value={mensagemLembrete}
          onChange={(e) => setMensagemLembrete(e.target.value)}
          rows={3}
          style={{ ...settingsInputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
        <div style={{ fontSize: 13, color: T.muted, marginTop: 10 }}>
          Variáveis disponíveis: {"{paciente}"}, {"{data}"}, {"{hora}"}
        </div>
      </SettingsSection>

      <SettingsSection title="Mensagem de cobrança">
        <textarea
          value={mensagemCobranca}
          onChange={(e) => setMensagemCobranca(e.target.value)}
          rows={3}
          style={{ ...settingsInputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
        <div style={{ fontSize: 13, color: T.muted, marginTop: 10 }}>
          Variáveis disponíveis: {"{paciente}"}, {"{referencia}"}, {"{valor}"}, {"{vencimento}"}
        </div>
      </SettingsSection>
    </>
  );
}

const SETTINGS_TABS = [
  { key: "pessoais", label: "Dados pessoais" },
  { key: "seguranca", label: "Segurança" },
  { key: "horario", label: "Horário de atendimento" },
  { key: "metas", label: "Configurações de metas" },
  { key: "whatsapp", label: "WhatsApp" },
];

function Configuracoes() {
  const [tab, setTab] = useState("pessoais");
  const [twoFactor, setTwoFactor] = useState(false);
  const [days, setDays] = useState(["Seg", "Ter", "Qua", "Qui", "Sex"]);
  const allDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const toggleDay = (d) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Gerencie seu perfil e preferências do consultório" />

      <div style={{ display: "flex", marginBottom: 24, borderBottom: `1px solid ${T.border}` }}>
        {SETTINGS_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: "0 0 14px", background: "none", cursor: "pointer",
                border: "none", borderBottom: active ? `3px solid ${T.primary}` : "3px solid transparent",
                marginBottom: -1, color: active ? T.primary : T.muted,
                fontWeight: 800, fontSize: 14.5, textTransform: "uppercase", letterSpacing: 0.5,
                textAlign: "center", whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 260px)" }}>
        {tab === "pessoais" && (
          <SettingsSection title="Perfil profissional">
            <div style={{ maxWidth: 560 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
                <Avatar initials="IT" color="purple" size={64} />
                <button style={{ padding: "10px 16px", borderRadius: 9, border: `1px solid ${T.border}`, background: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Alterar foto</button>
              </div>
              <Field label="Nome completo" defaultValue="Dra. Isadora Talamini" />
              <Field label="CRP" defaultValue="12/34567" />
              <Field label="E-mail" defaultValue="isadora.talamini@psystem.com" type="email" />
              <Field label="Telefone" defaultValue="(48) 99876-5432" />
            </div>
          </SettingsSection>
        )}

        {tab === "seguranca" && (
          <SettingsSection title="Segurança">
            <div style={{ maxWidth: 560 }}>
              <Field label="Senha atual" type="password" defaultValue="" />
              <Field label="Nova senha" type="password" defaultValue="" />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderTop: `1px solid ${T.border}`, marginTop: 6 }}>
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: T.text }}>Autenticação em duas etapas</div>
                  <div style={{ fontSize: 13.5, color: T.muted, marginTop: 3 }}>Exigir um código adicional ao entrar na conta.</div>
                </div>
                <Switch checked={twoFactor} onChange={setTwoFactor} />
              </div>
            </div>
          </SettingsSection>
        )}

        {tab === "horario" && (
          <SettingsSection title="Horário de atendimento">
            <div style={{ maxWidth: 560 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                {allDays.map((d) => {
                  const on = days.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDay(d)}
                      style={{
                        width: 56, height: 48, borderRadius: 9, border: `1px solid ${on ? T.primary : T.border}`,
                        background: on ? T.primaryTint : "#fff", color: on ? T.primaryDark : T.muted,
                        fontWeight: 700, fontSize: 14.5, cursor: "pointer",
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <Field label="Início" defaultValue="08:00" />
                <Field label="Término" defaultValue="18:00" />
              </div>
            </div>
          </SettingsSection>
        )}

        {tab === "metas" && <MetasTab />}
        {tab === "whatsapp" && <WhatsappTab />}

        <PrimaryButton style={{ width: "100%", justifyContent: "center", padding: "14px 0", fontSize: 15 }} icon={Check}>Salvar alterações</PrimaryButton>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Top bar (mobile / global)                                            */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* App                                                                   */
/* ------------------------------------------------------------------ */
function PrintArea({ content }) {
  if (!content) return <div className="print-area" />;
  const { template, patient, paragraphs } = content;
  return (
    <div className="print-area" style={{ padding: "48px 56px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{template.title.toUpperCase()}</div>
      <div style={{ height: 2, width: 60, background: "#1C2233", margin: "8px auto 28px" }} />
      {paragraphs.map((p, i) => (
        <p key={i} style={{ fontSize: 14, lineHeight: 1.9, marginBottom: 16, textAlign: "justify" }}>{p}</p>
      ))}
      <p style={{ fontSize: 14, marginTop: 32 }}>Criciúma, {todayLabel()}.</p>
      <div style={{ marginTop: 60, textAlign: "center" }}>
        <div style={{ borderTop: "1px solid #1C2233", width: 260, margin: "0 auto 6px" }} />
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>Dra. Isadora Talamini</div>
        <div style={{ fontSize: 12.5 }}>Psicóloga · CRP 12/34567</div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [printContent, setPrintContent] = useState(null);

  const pages = {
    dashboard: <Dashboard setPage={setPage} />,
    agenda: <Agenda setPage={setPage} />,
    pacientes: <Pacientes setPage={setPage} />,
    prontuarios: <Prontuarios />,
    relatorios: <Relatorios />,
    financeiro: <Financeiro />,
    declaracoes: <Declaracoes setPrintContent={setPrintContent} />,
    configuracoes: <Configuracoes />,
  };

  return (
    <DataProvider>
      <div style={{ fontFamily: "'Inter', sans-serif", background: T.bg, minHeight: "100vh", color: T.text }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          html, body, #root { margin: 0; padding: 0; height: 100%; }
          table { font-family: 'Inter', sans-serif; }
          select { font-family: 'Inter', sans-serif; }
          input:focus, select:focus { border-color: ${T.primary} !important; }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-thumb { background: #D8DCE9; border-radius: 8px; }
          .spin { animation: spin 0.8s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .print-area { display: none; }
          @media print {
            .app-shell { display: none !important; }
            .print-area { display: block !important; }
          }
        `}</style>

        <div className="app-shell" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          <Header />
          <div style={{ flex: 1, minWidth: 0, display: "flex", overflow: "hidden" }}>
            <Sidebar page={page} setPage={setPage} />
            <div style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
              <div style={{ padding: "20px 32px 48px" }}>
                {pages[page]}
              </div>
            </div>
          </div>
        </div>

        <PrintArea content={printContent} />
      </div>
    </DataProvider>
  );
}
