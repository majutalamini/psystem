import { BarChart3, CalendarDays, FileSignature, FileText, FileUp, HeartPulse, LayoutDashboard, Settings, UserRoundCheck, Users, Wallet } from "lucide-react";

export const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "agenda", label: "Agenda", icon: CalendarDays },
  { key: "pacientes", label: "Pacientes", icon: Users },
  { key: "responsaveis", label: "Responsáveis", icon: UserRoundCheck },
  { key: "financeiro", label: "Financeiro", icon: Wallet },
  { key: "prontuarios", label: "Prontuários", icon: FileText },
  { key: "anamneses", label: "Anamneses", icon: HeartPulse },
  { key: "relatorios", label: "Relatórios", icon: BarChart3 },
  { key: "declaracoes", label: "Declarações", icon: FileSignature },
  { key: "importacoes", label: "Importações", icon: FileUp },
  { key: "configuracoes", label: "Configurações", icon: Settings },
];
