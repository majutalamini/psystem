import { BarChart3, CalendarDays, FileSignature, FileText, LayoutDashboard, Settings, Users, Wallet } from "lucide-react";

export const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "agenda", label: "Agenda", icon: CalendarDays },
  { key: "pacientes", label: "Pacientes", icon: Users },
  { key: "prontuarios", label: "Prontuários", icon: FileText },
  { key: "relatorios", label: "Relatórios", icon: BarChart3 },
  { key: "declaracoes", label: "Declarações", icon: FileSignature },
  { key: "financeiro", label: "Financeiro", icon: Wallet },
  { key: "configuracoes", label: "Configurações", icon: Settings },
];
