import { useMemo } from "react";
import { BarChart3, CalendarClock, ChevronRight, CircleDollarSign, Clock, FileSignature, Plus, Star, TrendingDown, TrendingUp, Users, Users2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, MiniStat, PageHeader, StatCard } from "../../components/ui";
import { useAppData } from "../../hooks/useAppData";
import { T } from "../../styles/theme";
import { TODAY } from "../../utils/date";
import { navigate } from "../../utils/nav";
import AtencaoPacientesCard from "./components/AtencaoPacientesCard";
import PendenciasFinanceirasCard from "./components/PendenciasFinanceirasCard";
import QuickActionButton from "./components/QuickActionButton";
import WeekOverviewCard from "./components/WeekOverviewCard";

const STATUS_COLORS = [T.primary, "#DFE3EE"];

const brl = (v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

/* "Dra. Isadora Talamini" → "Dra. Isadora"; "Isadora Talamini" → "Isadora". */
function saudacao(nome) {
  const partes = String(nome || "").trim().split(/\s+/);
  return /^dra?\.?$/i.test(partes[0]) ? partes.slice(0, 2).join(" ") : partes[0];
}

export default function Dashboard({ stats, goals, todayAppointments, weekOverview, weekLabel, revenueData, sessionsPerMonth, pendencias, pendenciasTotal }) {
  const { patients, auth } = useAppData();
  // revenueData vem em milhares de reais (value: 8.2 = R$ 8.200), um item por mês dos últimos seis.
  const financeStats = useMemo(() => {
    const total = revenueData.reduce((s, d) => s + d.value, 0);
    const avg = total / revenueData.length;
    const best = revenueData.reduce((a, b) => (b.value > a.value ? b : a));
    const last = revenueData[revenueData.length - 1];
    const prev = revenueData[revenueData.length - 2];
    const growth = prev.value > 0 ? ((last.value - prev.value) / prev.value) * 100 : null;
    return { total, avg, best, growth };
  }, [revenueData]);
  const hoje = TODAY.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const statusData = [
    { name: "Ativos", value: patients.filter((p) => p.status === "Ativo").length },
    { name: "Inativos", value: patients.filter((p) => p.status === "Inativo").length },
  ];

  return (
    <div>
      <PageHeader
        title={`Olá, ${saudacao(auth.user.nome)}!`}
        subtitle={`Aqui está o resumo do seu consultório de hoje, ${hoje}.`}
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <QuickActionButton icon={Plus} label="Novo agendamento" onClick={() => navigate("agenda")} />
            <QuickActionButton icon={Users} label="Novo paciente" onClick={() => navigate("pacientes")} />
            <QuickActionButton icon={FileSignature} label="Gerar declaração" onClick={() => navigate("declaracoes")} />
          </div>
        }
      />

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label="Total de pacientes" value={stats.totalPacientes} delta={`+${stats.novosNoMes} esse mês`} icon={Users2} tone="primary" />
        <StatCard
          label="Sessões hoje"
          value={stats.sessoesHoje}
          delta={stats.cancelamentosHoje === 1 ? "1 cancelamento" : `${stats.cancelamentosHoje} cancelamentos`}
          deltaTone={stats.cancelamentosHoje > 0 ? "danger" : "success"}
          icon={CalendarClock}
          tone="primary"
        />
        <StatCard
          label="Faturamento no mês"
          value={`R$ ${brl(stats.faturamentoMes)}`}
          delta={`Meta: R$ ${brl(goals.faturamentoMensal)}`}
          deltaTone={stats.faturamentoMes >= goals.faturamentoMensal ? "success" : "danger"}
          icon={CircleDollarSign}
          tone="success"
        />
        <StatCard
          label="Horas na semana"
          value={`${brl(stats.horasSemana)}h`}
          delta={`Meta: ${goals.horasSemanais}h`}
          deltaTone={stats.horasSemana >= goals.horasSemanais ? "success" : "danger"}
          icon={Clock}
          tone="warn"
        />
      </div>

      <WeekOverviewCard days={weekOverview} weekLabel={weekLabel} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 15, color: T.text }}>
            Agendamentos de hoje
          </div>
          <div style={{ flex: 1 }}>
            {todayAppointments.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: T.muted }}>Nenhuma sessão agendada para hoje.</div>
            )}
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
              onClick={() => navigate("agenda")}
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
              Total no semestre: <span style={{ color: T.primary }}>R$ {financeStats.total.toFixed(1)}k</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
              <MiniStat label="Média mensal" value={`R$ ${financeStats.avg.toFixed(1)}k`} icon={BarChart3} />
              <MiniStat label="Melhor mês" value={financeStats.best.month} icon={Star} />
              <MiniStat
                label="Vs. mês anterior"
                value={financeStats.growth === null ? "—" : `${financeStats.growth >= 0 ? "+" : ""}${financeStats.growth.toFixed(1)}%`}
                icon={financeStats.growth === null || financeStats.growth >= 0 ? TrendingUp : TrendingDown}
                tone={financeStats.growth === null || financeStats.growth >= 0 ? "success" : "danger"}
              />
            </div>

            <div style={{ textAlign: "right" }}>
              <button
                onClick={() => navigate("financeiro")}
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
        <PendenciasFinanceirasCard pendencias={pendencias} total={pendenciasTotal} />
        <AtencaoPacientesCard />
      </div>
    </div>
  );
}
