import React, { useState, useMemo, useRef, useEffect, createContext, useContext } from "react";
import {
  LayoutDashboard, CalendarDays, Users, FileText, BarChart3, Wallet, Settings,
  Bell, Search, Plus, ChevronLeft, ChevronRight, Clock, Phone, Mail, X, Check,
  TrendingUp, TrendingDown, MoreVertical, Flower2, MapPin, Video, Edit3,
  Trash2, ChevronDown, CalendarClock, CircleDollarSign, Users2, Star,
  ArrowDownCircle, ArrowUpCircle, UploadCloud, FileSignature, FileCheck2,
  Image as ImageIcon, Receipt, Landmark, Printer, Copy, Eye, RefreshCw,
  ArrowLeft, ClipboardList, HeartPulse, User, Home, ShieldCheck, Cake, CreditCard
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import mammoth from "mammoth";

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
  { id: 1, name: "Maria Aparecida", initials: "MA", phone: "(48) 99123-4501", email: "maria.aparecida@email.com", status: "Ativo", sessions: 24, lastSession: "12/08/2026", nextSession: "19/08/2026", color: "purple", note: "Trabalhando estratégias de regulação emocional; boa adesão às tarefas de casa.", cpf: "123.456.789-01", nascimento: "14/03/1990", endereco: "Rua das Palmeiras, 210 — Centro, Criciúma/SC", convenio: "Particular", emergenciaNome: "José Aparecida (esposo)", emergenciaTelefone: "(48) 99900-1111", observacoes: "" },
  { id: 2, name: "Pedro Silva", initials: "PS", phone: "(48) 99123-4502", email: "pedro.silva@email.com", status: "Ativo", sessions: 8, lastSession: "10/08/2026", nextSession: "17/08/2026", color: "yellow", note: "Início de processo para ansiedade generalizada; relatou melhora no sono.", cpf: "234.567.890-12", nascimento: "22/07/1988", endereco: "Av. Centenário, 1450 — Pio Corrêa, Criciúma/SC", convenio: "Unimed", emergenciaNome: "Ana Silva (irmã)", emergenciaTelefone: "(48) 99900-2222", observacoes: "" },
  { id: 3, name: "Jorge Sousa", initials: "JS", phone: "(48) 99123-4503", email: "jorge.sousa@email.com", status: "Ativo", sessions: 15, lastSession: "09/08/2026", nextSession: "17/08/2026", color: "pink", note: "Foco em questões de carreira e autoestima; retomar plano de ação na próxima sessão.", cpf: "345.678.901-23", nascimento: "05/11/1995", endereco: "Rua Coronel Pedro Benedet, 88 — Centro, Criciúma/SC", convenio: "Particular", emergenciaNome: "Marta Sousa (mãe)", emergenciaTelefone: "(48) 99900-3333", observacoes: "" },
  { id: 4, name: "Patrícia Alves", initials: "PA", phone: "(48) 99123-4504", email: "patricia.alves@email.com", status: "Ativo", sessions: 32, lastSession: "11/08/2026", nextSession: "17/08/2026", color: "green", note: "Acompanhamento de luto; evolução consistente, reduzir para frequência quinzenal.", cpf: "456.789.012-34", nascimento: "30/01/1979", endereco: "Rua Marechal Deodoro, 675 — Centro, Criciúma/SC", convenio: "Bradesco Saúde", emergenciaNome: "Carlos Alves (filho)", emergenciaTelefone: "(48) 99900-4444", observacoes: "" },
  { id: 5, name: "Luísa Silva", initials: "LS", phone: "(48) 99123-4505", email: "luisa.silva@email.com", status: "Inativo", sessions: 6, lastSession: "22/06/2026", nextSession: "—", color: "teal", note: "Pausa solicitada pela paciente por motivos de agenda; retorno previsto em setembro.", cpf: "567.890.123-45", nascimento: "18/09/1992", endereco: "Rua Henrique Lage, 320 — Próspera, Criciúma/SC", convenio: "Particular", emergenciaNome: "Beatriz Silva (mãe)", emergenciaTelefone: "(48) 99900-5555", observacoes: "" },
  { id: 6, name: "Mike Pereira", initials: "MP", phone: "(48) 99123-4506", email: "mike.pereira@email.com", status: "Ativo", sessions: 3, lastSession: "14/08/2026", nextSession: "17/08/2026", color: "purple", note: "Sessões iniciais de anamnese; construção de vínculo terapêutico em andamento.", cpf: "678.901.234-56", nascimento: "02/05/2000", endereco: "Rua Fernando Machado, 55 — Centro, Criciúma/SC", convenio: "SulAmérica", emergenciaNome: "Sandra Pereira (mãe)", emergenciaTelefone: "(48) 99900-6666", observacoes: "" },
  { id: 7, name: "Ana Carolina Santos", initials: "AC", phone: "(48) 99123-4507", email: "ana.carolina@email.com", status: "Ativo", sessions: 41, lastSession: "17/08/2026", nextSession: "24/08/2026", color: "green", note: "Terapia de longo prazo para TOC; manutenção com bons resultados.", cpf: "789.012.345-67", nascimento: "27/12/1985", endereco: "Rua Gustavo Richard, 140 — Centro, Criciúma/SC", convenio: "Particular", emergenciaNome: "Rafael Santos (esposo)", emergenciaTelefone: "(48) 99900-7777", observacoes: "" },
  { id: 8, name: "João Silva", initials: "JS", phone: "(48) 99123-4508", email: "joao.silva@email.com", status: "Ativo", sessions: 12, lastSession: "17/08/2026", nextSession: "24/08/2026", color: "yellow", note: "Consulta online; trabalhando comunicação assertiva no ambiente de trabalho.", cpf: "890.123.456-78", nascimento: "09/06/1993", endereco: "Rua Desembargador Pedro Silva, 402 — Centro, Criciúma/SC", convenio: "Amil", emergenciaNome: "Renata Silva (esposa)", emergenciaTelefone: "(48) 99900-8888", observacoes: "" },
  { id: 9, name: "Maria Cardoso", initials: "MC", phone: "(48) 99123-4509", email: "maria.cardoso@email.com", status: "Inativo", sessions: 19, lastSession: "30/05/2026", nextSession: "—", color: "pink", note: "Encerramento de processo terapêutico por alta; acompanhamento concluído com êxito.", cpf: "901.234.567-89", nascimento: "11/02/1983", endereco: "Rua Felipe Schmidt, 96 — Centro, Criciúma/SC", convenio: "Particular", emergenciaNome: "Paulo Cardoso (esposo)", emergenciaTelefone: "(48) 99900-9999", observacoes: "" },
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
    icon: FileCheck2,
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
    icon: FileSignature,
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
    icon: ImageIcon,
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
    icon: Receipt,
    fields: [
      { key: "valor", label: "Valor recebido (R$)", type: "number", default: 200 },
      { key: "forma", label: "Forma de pagamento", type: "select", options: ["Pix", "Cartão", "Dinheiro"], default: "Pix" },
      { key: "referente", label: "Referente a", type: "text", default: "sessão de psicoterapia" },
    ],
    build: (p, v, date) => [
      `Recebi de ${p.name} a quantia de R$ ${Number(v.valor).toLocaleString("pt-BR")}, via ${v.forma}, referente a ${v.referente}, em ${date}.`,
    ],
  },
  {
    id: "ir",
    title: "Declaração para Imposto de Renda",
    desc: "Comprovante anual de valores pagos, para fins de declaração de IR.",
    icon: Landmark,
    fields: [
      { key: "ano", label: "Ano-calendário", type: "text", default: "2026" },
      { key: "valorTotal", label: "Valor total pago no ano (R$)", type: "number", default: 2400 },
    ],
    build: (p, v, date) => [
      `Declaro, para fins de comprovação junto à Receita Federal, que ${p.name} realizou pagamentos referentes a sessões de psicoterapia no ano-calendário de ${v.ano}, no valor total de R$ ${Number(v.valorTotal).toLocaleString("pt-BR")}.`,
      `Documento emitido em ${date}.`,
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
    Object.fromEntries(initialPatients.map((p) => [p.id, [{ date: p.lastSession, html: `<p>${p.note}</p>` }]]))
  );
  const [anamneses, setAnamneses] = useState({});
  const [receivables, setReceivables] = useState(initialReceivables);

  function addPatient(newPatient) {
    setPatients((prev) => [newPatient, ...prev]);
    setRecords((prev) => ({ ...prev, [newPatient.id]: [] }));
  }

  function updatePatient(id, changes) {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)));
  }

  function addRecord(patientId, entry) {
    setRecords((prev) => ({ ...prev, [patientId]: [entry, ...(prev[patientId] || [])] }));
  }

  function saveAnamnese(patientId, data) {
    setAnamneses((prev) => ({ ...prev, [patientId]: data }));
  }

  function addReceivable(entry) {
    setReceivables((prev) => [{ id: Date.now(), ...entry }, ...prev]);
  }

  const value = {
    patients, setPatients, addPatient, updatePatient,
    records, addRecord,
    anamneses, saveAnamnese,
    receivables, addReceivable,
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
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 320 }}>
      <Search size={16} color={T.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10, border: `1px solid ${T.border}`,
          fontSize: 14, outline: "none", background: T.surface, color: T.text, boxSizing: "border-box",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                              */
/* ------------------------------------------------------------------ */
function Sidebar({ page, setPage }) {
  return (
    <aside
      style={{
        width: 232, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column", height: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "22px 20px 18px" }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Flower2 size={19} color={T.primary} />
        </div>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 19, color: T.text }}>Psystem</span>
      </div>

      <nav style={{ flex: 1, padding: "6px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((item) => {
          const active = page === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10,
                border: "none", cursor: "pointer", fontSize: 14, fontWeight: active ? 600 : 500,
                background: active ? T.primaryTint : "transparent", color: active ? T.primaryDark : T.muted,
                textAlign: "left", width: "100%", transition: "background .12s, color .12s",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#F5F6FA"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: 16, borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar initials="IT" color="purple" size={38} />
        <div style={{ lineHeight: 1.25 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Dra. Isadora Talamini</div>
          <div style={{ fontSize: 12, color: T.muted }}>Psicóloga · CRP 12/34567</div>
        </div>
      </div>
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
        <div style={{ width: 30, height: 30, borderRadius: 8, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color={c.icon} />
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
          <Icon size={12} color={t.c} />
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
      <Icon size={15} color={T.primary} />
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
          Ver agenda <ChevronRight size={14} />
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
          Ver financeiro completo <ChevronRight size={14} />
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
          Ver todos os pacientes <ChevronRight size={14} />
        </button>
      </div>
    </Card>
  );
}

function Dashboard({ setPage }) {
  const financeStats = useMemo(() => {
    const avg = revenueData.reduce((s, d) => s + d.value, 0) / revenueData.length;
    const best = revenueData.reduce((a, b) => (b.value > a.value ? b : a));
    const last = revenueData[revenueData.length - 1];
    const prev = revenueData[revenueData.length - 2];
    const growth = ((last.value - prev.value) / prev.value) * 100;
    return { avg, best, growth };
  }, []);

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
        <StatCard label="Faturamento no mês" value="R$ 8.200" delta="+5,1% vs mês anterior" icon={CircleDollarSign} tone="success" />
        <StatCard label="Horas na semana" value="18h" delta="Meta: 20h" deltaTone="danger" icon={Clock} tone="warn" />
      </div>

      <WeekOverviewCard setPage={setPage} />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 1fr) 2fr", gap: 20, marginBottom: 20 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ background: T.primary, color: "#fff", padding: "14px 20px", fontWeight: 700, fontSize: 15 }}>
            Próximos agendamentos
          </div>
          <div>
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
          <div style={{ padding: "14px 20px" }}>
            <button
              onClick={() => setPage("agenda")}
              style={{ background: "none", border: "none", color: T.primary, fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }}
            >
              Ver agenda completa <ChevronRight size={15} />
            </button>
          </div>
        </Card>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ background: T.primary, color: "#fff", padding: "14px 20px", fontWeight: 700, fontSize: 15 }}>
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

            <button
              onClick={() => setPage("financeiro")}
              style={{ background: "none", border: "none", color: T.primary, fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }}
            >
              Ver financeiro completo <ChevronRight size={15} />
            </button>
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
      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        <Pill tone="muted">{event.type}</Pill>
        <Pill tone={event.status === "Confirmado" ? "success" : "warn"}>{event.status}</Pill>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onCancelAppointment}
          style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.dangerTint}`, background: T.dangerTint, color: T.danger, fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}
        >
          Cancelar agendamento
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

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
function weekdayIndex(offset) {
  return ((offset % 7) + 7) % 7; // 0 = Monday, since offset 0 (baseDate) is a Monday
}

function AgendaWeekStrip({ dayOffset, setDayOffset, events }) {
  const weekStart = dayOffset - weekdayIndex(dayOffset);
  const baseDate = new Date(2026, 7, 17);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <button onClick={() => setDayOffset(weekStart - 7)} style={iconBtn}><ChevronLeft size={16} /></button>
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
      <button onClick={() => setDayOffset(weekStart + 7)} style={iconBtn}><ChevronRight size={16} /></button>
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

  const baseDate = new Date(2026, 7, 17);
  const shown = new Date(baseDate);
  shown.setDate(baseDate.getDate() + dayOffset);
  const label = dayOffset === 0 ? "Hoje" : shown.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" });

  const schedule = useMemo(() => {
    return [...(events[dayOffset] || [])].sort((a, b) => a.time.localeCompare(b.time));
  }, [dayOffset, events]);

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
                          {ev.type === "Consulta online" ? <Video size={12} /> : <MapPin size={12} />} {ev.type}
                        </div>
                      </div>
                      <MoreVertical size={16} color={EVENT_STYLES[ev.color].text} style={{ opacity: 0.6, flexShrink: 0 }} />
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
          onCancelAppointment={() => { removeEvent(dayOffset, selectedEvent.time); setSelectedEvent(null); }}
          onGoProntuario={() => { setSelectedEvent(null); setPage && setPage("prontuarios"); }}
        />
      )}
    </div>
  );
}

const iconBtn = { width: 34, height: 34, borderRadius: 9, border: `1px solid ${T.border}`, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.text };


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
      <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>Dados pessoais</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Nome completo *" value={form.name} onChange={set("name")} placeholder="Nome do paciente" />
        <FormField label="Data de nascimento" value={form.nascimento} onChange={set("nascimento")} placeholder="dd/mm/aaaa" />
        <FormField label="CPF" value={form.cpf} onChange={set("cpf")} placeholder="000.000.000-00" />
        <FormField label="Status" value={form.status} onChange={set("status")} options={["Ativo", "Inativo"]} />
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, margin: "6px 0 8px" }}>Contato</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Telefone *" value={form.phone} onChange={set("phone")} placeholder="(00) 00000-0000" />
        <FormField label="E-mail" value={form.email} onChange={set("email")} type="email" placeholder="paciente@email.com" />
      </div>
      <FormField label="Endereço completo" value={form.endereco} onChange={set("endereco")} placeholder="Rua, número — bairro, cidade/UF" />

      <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, margin: "6px 0 8px" }}>Convênio e emergência</div>
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
        <Icon size={15} color={T.primary} />
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

const ANAMNESE_FIELDS = [
  { key: "queixa", label: "Queixa principal" },
  { key: "historicoSaude", label: "Histórico de saúde" },
  { key: "historicoFamiliar", label: "Histórico familiar" },
  { key: "medicacao", label: "Uso de medicação" },
  { key: "expectativas", label: "Expectativas com a terapia" },
  { key: "observacoesAnamnese", label: "Informações adicionais" },
];

function AnamneseTab({ patient }) {
  const { anamneses, saveAnamnese } = useAppData();
  const existing = anamneses[patient.id];
  const [editing, setEditing] = useState(!existing);
  const [form, setForm] = useState(() => existing || Object.fromEntries(ANAMNESE_FIELDS.map((f) => [f.key, ""])));

  function handleSave() {
    saveAnamnese(patient.id, { ...form, preenchidoEm: todayLabel() });
    setEditing(false);
  }

  if (!editing) {
    return (
      <Card style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: T.muted }}>Preenchida em {existing.preenchidoEm}</div>
          <button onClick={() => setEditing(true)} style={{ ...iconBtn, background: "#fff" }} title="Editar anamnese"><Edit3 size={15} /></button>
        </div>
        {ANAMNESE_FIELDS.map((f) => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>{f.label}</div>
            <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.6 }}>{form[f.key] || "—"}</div>
          </div>
        ))}
      </Card>
    );
  }

  return (
    <Card style={{ padding: 24 }}>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 14 }}>
        Preencha a anamnese do paciente. Essas informações ficam salvas no perfil dele.
      </div>
      {ANAMNESE_FIELDS.map((f) => (
        <FormField key={f.key} label={f.label} value={form[f.key]} onChange={(v) => setForm({ ...form, [f.key]: v })} textarea />
      ))}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        {existing && (
          <button onClick={() => setEditing(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        )}
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Check} onClick={handleSave}>Salvar anamnese</PrimaryButton>
      </div>
    </Card>
  );
}

function ProntuarioTab({ patient }) {
  const { records, addRecord } = useAppData();
  const [showEditor, setShowEditor] = useState(false);
  const history = records[patient.id] || [];

  return (
    <Card style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>Linha do tempo</div>
        <PrimaryButton icon={Plus} onClick={() => setShowEditor(true)}>Novo prontuário</PrimaryButton>
      </div>
      {history.length === 0 ? (
        <div style={{ fontSize: 13.5, color: T.muted, padding: "8px 0" }}>Nenhum prontuário registrado ainda para este paciente.</div>
      ) : (
        history.map((h, i) => (
          <div key={i} style={{ display: "flex", gap: 14, paddingBottom: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.primary, marginTop: 4 }} />
              {i < history.length - 1 && <div style={{ flex: 1, width: 2, background: T.border, marginTop: 4 }} />}
            </div>
            <div style={{ paddingBottom: 4, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{h.date}</div>
              <div dangerouslySetInnerHTML={{ __html: h.html }} style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.6 }} />
            </div>
          </div>
        ))
      )}

      {showEditor && (
        <RecordEditorModal
          patient={patient}
          initialHtml={null}
          onClose={() => setShowEditor(false)}
          onSave={(html) => { addRecord(patient.id, { date: todayLabel(), html }); setShowEditor(false); }}
        />
      )}
    </Card>
  );
}

function FinanceiroTab({ patient }) {
  const { receivables, addReceivable } = useAppData();
  const [showModal, setShowModal] = useState(false);
  const mine = receivables.filter((r) => r.paciente === patient.name);
  const pagos = mine.filter((r) => r.status === "Pago");
  const debitos = mine.filter((r) => r.status !== "Pago");
  const totalPago = pagos.reduce((s, r) => s + r.valor, 0);
  const totalDevido = debitos.reduce((s, r) => s + r.valor, 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard label="Total pago" value={`R$ ${totalPago.toLocaleString("pt-BR")}`} icon={TrendingUp} tone="success" />
        <StatCard label="Em aberto" value={`R$ ${totalDevido.toLocaleString("pt-BR")}`} icon={Clock} tone={totalDevido > 0 ? "danger" : "primary"} />
      </div>

      <Card style={{ overflow: "hidden", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontWeight: 700, fontSize: 14.5, color: T.text }}>Pagamentos realizados</span>
        </div>
        {pagos.length === 0 ? (
          <div style={{ padding: 20, fontSize: 13, color: T.muted }}>Nenhum pagamento registrado ainda.</div>
        ) : (
          pagos.map((r, i) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>{r.referencia}</div>
                <div style={{ fontSize: 12, color: T.muted }}>Vencimento {r.vencimento}</div>
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: T.success }}>R$ {r.valor.toLocaleString("pt-BR")}</span>
            </div>
          ))
        )}
      </Card>

      <Card style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontWeight: 700, fontSize: 14.5, color: T.text }}>Débitos em conta</span>
          <PrimaryButton icon={Plus} onClick={() => setShowModal(true)}>Novo lançamento</PrimaryButton>
        </div>
        {debitos.length === 0 ? (
          <div style={{ padding: 20, fontSize: 13, color: T.muted }}>Nenhum débito em aberto. 🎉</div>
        ) : (
          debitos.map((r, i) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>{r.referencia}</div>
                <div style={{ fontSize: 12, color: T.muted }}>Vencimento {r.vencimento}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>R$ {r.valor.toLocaleString("pt-BR")}</span>
                <Pill tone={statusTone(r.status)}>{r.status}</Pill>
              </div>
            </div>
          ))
        )}
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

const PROFILE_TABS = [
  { key: "dados", label: "Dados pessoais", icon: User },
  { key: "anamnese", label: "Anamnese", icon: HeartPulse },
  { key: "prontuario", label: "Prontuário", icon: FileText },
  { key: "financeiro", label: "Financeiro", icon: Wallet },
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
        <ArrowLeft size={15} /> Voltar para pacientes
      </button>

      <Card style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Avatar initials={patient.initials} color={patient.color} size={58} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20, color: T.text }}>{patient.name}</span>
              <Pill tone={patient.status === "Ativo" ? "success" : "muted"}>{patient.status}</Pill>
            </div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
              {patient.sessions} sessões · última em {patient.lastSession} · próxima {patient.nextSession}
            </div>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 9, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            <Edit3 size={15} /> Editar cadastro
          </button>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {PROFILE_TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10, cursor: "pointer",
                border: active ? `1.5px solid ${T.primary}` : `1px solid ${T.border}`,
                background: active ? T.primaryTint : "#fff", color: active ? T.primaryDark : T.text,
                fontWeight: 700, fontSize: 13.5,
              }}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "dados" && <DadosPessoaisTab patient={patient} />}
      {tab === "anamnese" && <AnamneseTab patient={patient} />}
      {tab === "prontuario" && <ProntuarioTab patient={patient} />}
      {tab === "financeiro" && <FinanceiroTab patient={patient} />}

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
      <PageHeader
        title="Pacientes"
        subtitle="Gerencie a sua base de pacientes"
        action={<PrimaryButton icon={Plus} onClick={() => setShowNewModal(true)}>Novo paciente</PrimaryButton>}
      />

      <div style={{ marginBottom: 16 }}>
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar paciente..." />
      </div>

      <Card style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFBFE", textAlign: "left" }}>
              {["Paciente", "Contato", "Sessões", "Última sessão", "Próxima sessão", "Status", ""].map((h) => (
                <th key={h} style={{ padding: "12px 20px", fontSize: 12.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar initials={p.initials} color={p.color} />
                    <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{p.name}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: T.muted }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}><Phone size={12} /> {p.phone}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={12} /> {p.email}</div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 14, color: T.text, fontWeight: 600 }}>{p.sessions}</td>
                <td style={{ padding: "14px 20px", fontSize: 13.5, color: T.text }}>{p.lastSession}</td>
                <td style={{ padding: "14px 20px", fontSize: 13.5, color: T.text }}>{p.nextSession}</td>
                <td style={{ padding: "14px 20px" }}>
                  <Pill tone={p.status === "Ativo" ? "success" : "muted"}>{p.status}</Pill>
                </td>
                <td style={{ padding: "14px 20px", textAlign: "right" }}>
                  <MoreVertical size={16} color={T.muted} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
const DEFAULT_RECORD_SKELETON = `
  <p><strong>Queixa principal:</strong> descreva aqui.</p>
  <p><strong>Evolução da sessão:</strong> descreva aqui.</p>
  <p><strong>Conduta / plano terapêutico:</strong> descreva aqui.</p>
`;

function todayLabel() {
  return new Date(2026, 7, 17).toLocaleDateString("pt-BR");
}

function UploadRecordCard({ templateName, onUpload, onClear, loading, error }) {
  const fileRef = useRef(null);
  return (
    <Card style={{ padding: 18, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={20} color={T.primary} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: T.text }}>Enviar prontuário (.docx)</div>
            {templateName ? (
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>
                Último arquivo enviado: <strong style={{ color: T.text }}>{templateName}</strong> — também usado como base para novos prontuários manuais.
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>
                Envie o arquivo .docx do prontuário — em seguida você escolhe a qual paciente ele pertence.
              </div>
            )}
            {error && <div style={{ fontSize: 12.5, color: T.danger, marginTop: 4 }}>{error}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <input ref={fileRef} type="file" accept=".docx" style={{ display: "none" }} onChange={(e) => { e.target.files[0] && onUpload(e.target.files[0]); e.target.value = ""; }} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 9, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            {loading ? <RefreshCw size={15} className="spin" /> : <UploadCloud size={15} />}
            {templateName ? "Enviar novo (.docx)" : "Enviar arquivo (.docx)"}
          </button>
          {templateName && (
            <button onClick={onClear} style={{ ...iconBtn, background: "#fff" }} title="Remover modelo"><Trash2 size={15} /></button>
          )}
        </div>
      </div>
    </Card>
  );
}

function LinkPatientModal({ fileName, html, defaultPatientId, onClose, onConfirm }) {
  const { patients } = useAppData();
  const [patientId, setPatientId] = useState(defaultPatientId);
  const [date, setDate] = useState(todayLabel());
  return (
    <Modal title="Vincular prontuário ao paciente" onClose={onClose} width={520}>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <FileText size={14} /> Arquivo enviado: <strong style={{ color: T.text }}>{fileName}</strong>
      </div>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Paciente</label>
      <select value={patientId} onChange={(e) => setPatientId(Number(e.target.value))} style={inputStyle}>
        {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Data do registro</label>
      <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="dd/mm/aaaa" style={inputStyle} />

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Pré-visualização</label>
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, maxHeight: 220, overflowY: "auto", fontSize: 13, lineHeight: 1.6, color: T.text, background: "#FAFBFE", margin: "6px 0 16px" }}
      />

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Check} onClick={() => onConfirm(patientId, date)}>Vincular e salvar</PrimaryButton>
      </div>
    </Modal>
  );
}

function RecordEditorModal({ patient, initialHtml, onClose, onSave }) {
  const editorRef = useRef(null);
  return (
    <Modal title={`Novo prontuário — ${patient.name}`} onClose={onClose} width={640}>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 10 }}>
        Edite livremente o conteúdo abaixo. {initialHtml ? "O texto foi pré-preenchido a partir do último arquivo enviado." : "Nenhum arquivo enviado ainda — usando estrutura padrão."}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: initialHtml || DEFAULT_RECORD_SKELETON }}
        style={{
          border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, minHeight: 260, maxHeight: 420, overflowY: "auto",
          fontSize: 13.5, lineHeight: 1.7, color: T.text, background: "#FAFBFE", outline: "none",
        }}
      />
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={() => onSave(editorRef.current?.innerHTML || "")}>Salvar prontuário</PrimaryButton>
      </div>
    </Modal>
  );
}

function TemplatePreviewModal({ html, onClose }) {
  return (
    <Modal title="Último arquivo enviado" onClose={onClose} width={640}>
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, maxHeight: 460, overflowY: "auto", fontSize: 13.5, lineHeight: 1.7, color: T.text, background: "#FAFBFE" }}
      />
    </Modal>
  );
}

function Prontuarios() {
  const { patients, records, addRecord } = useAppData();
  const [selected, setSelected] = useState(patients[0].id);
  const [query, setQuery] = useState("");
  const [templateName, setTemplateName] = useState(null);
  const [templateHtml, setTemplateHtml] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null); // { name, html } awaiting patient link

  const active = patients.find((p) => p.id === selected);
  const filtered = patients.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  const history = records[selected] || [];

  async function handleUpload(file) {
    setLoading(true);
    setUploadError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setPendingUpload({ name: file.name, html: result.value });
    } catch (err) {
      setUploadError("Não foi possível ler este arquivo. Envie um .docx válido.");
    } finally {
      setLoading(false);
    }
  }

  function confirmLink(patientId, date) {
    addRecord(patientId, { date, html: pendingUpload.html });
    setTemplateName(pendingUpload.name);
    setTemplateHtml(pendingUpload.html);
    setSelected(patientId);
    setPendingUpload(null);
  }

  function saveRecord(html) {
    addRecord(selected, { date: todayLabel(), html });
    setShowEditor(false);
  }

  return (
    <div>
      <PageHeader
        title="Prontuários"
        subtitle="Histórico clínico e evolução dos pacientes"
        action={<PrimaryButton icon={Plus} onClick={() => setShowEditor(true)}>Novo prontuário</PrimaryButton>}
      />

      <UploadRecordCard
        templateName={templateName}
        onUpload={handleUpload}
        onClear={() => { setTemplateName(null); setTemplateHtml(null); }}
        loading={loading}
        error={uploadError}
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
                onClick={() => setSelected(p.id)}
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

        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <Avatar initials={active.initials} color={active.color} size={50} />
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: T.text }}>{active.name}</div>
              <div style={{ fontSize: 13, color: T.muted }}>{active.sessions} sessões · {active.status}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {templateHtml && (
                <button onClick={() => setShowPreview(true)} style={iconBtn} title="Visualizar último arquivo enviado"><Eye size={15} /></button>
              )}
              <button onClick={() => setShowEditor(true)} style={iconBtn} title="Novo registro"><Edit3 size={15} /></button>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>Linha do tempo</div>
          <div>
            {history.length === 0 ? (
              <div style={{ fontSize: 13.5, color: T.muted, padding: "8px 0" }}>Nenhum prontuário registrado ainda para este paciente.</div>
            ) : (
              history.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 14, paddingBottom: 18 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.primary, marginTop: 4 }} />
                    {i < history.length - 1 && <div style={{ flex: 1, width: 2, background: T.border, marginTop: 4 }} />}
                  </div>
                  <div style={{ paddingBottom: 4, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{h.date}</div>
                    <div
                      dangerouslySetInnerHTML={{ __html: h.html }}
                      style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.6, maxWidth: 560 }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {pendingUpload && (
        <LinkPatientModal
          fileName={pendingUpload.name}
          html={pendingUpload.html}
          defaultPatientId={selected}
          onClose={() => setPendingUpload(null)}
          onConfirm={confirmLink}
        />
      )}
      {showEditor && (
        <RecordEditorModal
          patient={active}
          initialHtml={templateHtml}
          onClose={() => setShowEditor(false)}
          onSave={saveRecord}
        />
      )}
      {showPreview && templateHtml && (
        <TemplatePreviewModal html={templateHtml} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Relatórios                                                           */
/* ------------------------------------------------------------------ */
function Relatorios() {
  const { patients } = useAppData();
  const statusData = [
    { name: "Ativos", value: patients.filter((p) => p.status === "Ativo").length },
    { name: "Inativos", value: patients.filter((p) => p.status === "Inativo").length },
  ];
  const statusColors = [T.primary, "#DFE3EE"];

  const topPatients = [...patients].sort((a, b) => b.sessions - a.sessions).slice(0, 5);

  return (
    <div>
      <PageHeader title="Relatórios" subtitle="Indicadores do seu consultório" />

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label="Sessões no mês" value="42" delta="+6 vs mês anterior" icon={CalendarClock} />
        <StatCard label="Ticket médio" value="R$ 195" delta="+2,4%" icon={CircleDollarSign} />
        <StatCard label="Taxa de retenção" value="87%" delta="+3 pts" icon={Users2} />
        <StatCard label="Satisfação média" value="4,8 / 5" delta="32 avaliações" deltaTone="success" icon={Star} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>Sessões por mês</div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={[{ month: "Mar", sessoes: 30 }, { month: "Abr", sessoes: 34 }, { month: "Mai", sessoes: 39 }, { month: "Jun", sessoes: 33 }, { month: "Jul", sessoes: 40 }, { month: "Ago", sessoes: 42 }]} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
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
          <ResponsiveContainer width="100%" height={230}>
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

      <Card style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 14 }}>Pacientes com mais sessões</div>
        {topPatients.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <Avatar initials={p.initials} color={p.color} size={30} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: T.text, width: 170 }}>{p.name}</span>
            <div style={{ flex: 1, background: "#F1F3F9", borderRadius: 999, height: 8, overflow: "hidden" }}>
              <div style={{ width: `${(p.sessions / topPatients[0].sessions) * 100}%`, background: T.primary, height: "100%", borderRadius: 999 }} />
            </div>
            <span style={{ fontSize: 13, color: T.muted, width: 70, textAlign: "right" }}>{p.sessions} sessões</span>
          </div>
        ))}
      </Card>
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
          <ArrowDownCircle size={16} /> Contas a receber
        </button>
        <button
          onClick={() => setTab("pagar")}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 9, border: "none",
            cursor: "pointer", fontSize: 14, fontWeight: 700, background: tab === "pagar" ? "#fff" : "transparent",
            color: tab === "pagar" ? T.primaryDark : T.muted, boxShadow: tab === "pagar" ? "0 1px 3px rgba(28,34,51,0.08)" : "none",
          }}
        >
          <ArrowUpCircle size={16} /> Contas a pagar
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
          <Copy size={15} /> {copied ? "Copiado!" : "Copiar texto"}
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {DECLARATION_TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.id} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={19} color={T.primary} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>{t.title}</div>
                <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>{t.desc}</div>
              </div>
              <button
                onClick={() => setActiveTemplate(t)}
                style={{
                  marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "9px 0", borderRadius: 9, border: `1px solid ${T.primaryTint}`, background: T.primaryTint,
                  color: T.primaryDark, fontWeight: 700, fontSize: 13.5, cursor: "pointer",
                }}
              >
                <FileSignature size={15} /> Gerar declaração
              </button>
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
    <Card style={{ padding: 22, marginBottom: 18 }}>
      <div style={{ fontWeight: 700, fontSize: 15.5, color: T.text, marginBottom: 16 }}>{title}</div>
      {children}
    </Card>
  );
}

function Field({ label, defaultValue, type = "text" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted, display: "block", marginBottom: 6 }}>{label}</label>
      <input type={type} defaultValue={defaultValue} style={{ ...inputStyle, margin: 0 }} />
    </div>
  );
}

function Configuracoes() {
  const [notifs, setNotifs] = useState({ email: true, sms: false, push: true, autoConfirm: true });
  const [days, setDays] = useState(["Seg", "Ter", "Qua", "Qui", "Sex"]);
  const allDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const toggleDay = (d) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Gerencie seu perfil e preferências do consultório" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        <div>
          <SettingsSection title="Perfil profissional">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <Avatar initials="IT" color="purple" size={56} />
              <button style={{ padding: "8px 14px", borderRadius: 9, border: `1px solid ${T.border}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Alterar foto</button>
            </div>
            <Field label="Nome completo" defaultValue="Dra. Isadora Talamini" />
            <Field label="CRP" defaultValue="12/34567" />
            <Field label="E-mail" defaultValue="isadora.talamini@psystem.com" type="email" />
            <Field label="Telefone" defaultValue="(48) 99876-5432" />
          </SettingsSection>

          <SettingsSection title="Horário de atendimento">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {allDays.map((d) => {
                const on = days.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    style={{
                      width: 44, height: 38, borderRadius: 9, border: `1px solid ${on ? T.primary : T.border}`,
                      background: on ? T.primaryTint : "#fff", color: on ? T.primaryDark : T.muted,
                      fontWeight: 700, fontSize: 12.5, cursor: "pointer",
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <Field label="Início" defaultValue="08:00" />
              <Field label="Término" defaultValue="18:00" />
            </div>
          </SettingsSection>
        </div>

        <div>
          <SettingsSection title="Notificações">
            {[
              { key: "email", label: "Lembretes por e-mail", desc: "Enviar lembrete de sessão para pacientes por e-mail." },
              { key: "sms", label: "Lembretes por SMS", desc: "Enviar lembrete de sessão por mensagem de texto." },
              { key: "push", label: "Notificações push", desc: "Receber alertas no navegador e no app." },
              { key: "autoConfirm", label: "Confirmação automática", desc: "Confirmar agendamentos assim que forem criados." },
            ].map((row) => (
              <div key={row.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderTop: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{row.label}</div>
                  <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2, maxWidth: 320 }}>{row.desc}</div>
                </div>
                <Switch checked={notifs[row.key]} onChange={(v) => setNotifs({ ...notifs, [row.key]: v })} />
              </div>
            ))}
          </SettingsSection>

          <SettingsSection title="Segurança">
            <Field label="Senha atual" type="password" defaultValue="" />
            <Field label="Nova senha" type="password" defaultValue="" />
          </SettingsSection>

          <PrimaryButton style={{ width: "100%", justifyContent: "center", padding: "12px 0" }} icon={Check}>Salvar alterações</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Top bar (mobile / global)                                            */
/* ------------------------------------------------------------------ */
function TopBar({ page }) {
  const current = NAV.find((n) => n.key === page);
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 14, padding: "18px 32px 0" }}>
      <button style={{ ...iconBtn, background: "#fff" }}><Bell size={16} /></button>
      <button style={{ ...iconBtn, background: "#fff" }}><Settings size={16} /></button>
    </div>
  );
}

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

        <div className="app-shell" style={{ display: "flex", height: "100vh" }}>
          <Sidebar page={page} setPage={setPage} />
          <div style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
            <TopBar page={page} />
            <div style={{ padding: "20px 32px 48px" }}>
              {pages[page]}
            </div>
          </div>
        </div>

        <PrintArea content={printContent} />
      </div>
    </DataProvider>
  );
}
