import { useMemo } from "react";
import { BarChart3, CalendarClock, ChevronRight, CircleDollarSign, Clock, FileSignature, Plus, Star, TrendingDown, TrendingUp, Users, Users2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, MiniStat, PageHeader, StatCard } from "../../components/ui";
import { revenueData, sessionsPerMonth, todayAppointments } from "../../data/dashboard";
import { useAppData } from "../../hooks/useAppData";
import { T } from "../../styles/theme";
import AtencaoPacientesCard from "./components/AtencaoPacientesCard";
import PendenciasFinanceirasCard from "./components/PendenciasFinanceirasCard";
import QuickActionButton from "./components/QuickActionButton";
import WeekOverviewCard from "./components/WeekOverviewCard";

const STATUS_COLORS = [T.primary, "#DFE3EE"];

export default function Dashboard({ onNavigate }) {
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

  return (
    <div>
      <PageHeader
        title="Olá, Dra. Isadora!"
        subtitle="Aqui está o resumo do seu consultório de hoje, segunda-feira, 17 de agosto."
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <QuickActionButton icon={Plus} label="Novo agendamento" onClick={() => onNavigate("agenda")} />
            <QuickActionButton icon={Users} label="Novo paciente" onClick={() => onNavigate("pacientes")} />
            <QuickActionButton icon={FileSignature} label="Gerar declaração" onClick={() => onNavigate("declaracoes")} />
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

      <WeekOverviewCard onNavigate={onNavigate} />

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
              onClick={() => onNavigate("agenda")}
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
                onClick={() => onNavigate("financeiro")}
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
                {statusData.map((d, i) => <Cell key={i} fill={STATUS_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 6 }}>
            {statusData.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.muted }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: STATUS_COLORS[i] }} /> {d.name} ({d.value})
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <PendenciasFinanceirasCard onNavigate={onNavigate} />
        <AtencaoPacientesCard onNavigate={onNavigate} />
      </div>
    </div>
  );
}
