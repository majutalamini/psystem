import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "../../../components/ui";
import { AGE_BUCKETS } from "../../../data/reports";
import { useAppData } from "../../../hooks/useAppData";
import { filterInputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import { ageFromBrDate } from "../../../utils/date";
import FilterBar from "../components/FilterBar";
import FilterField from "../components/FilterField";
import { reportCellStyle } from "../components/reportStyles";
import ReportTableCard from "../components/ReportTableCard";

export default function ReportFaixaEtaria() {
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
