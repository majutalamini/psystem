import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { filterInputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import FilterBar from "../components/FilterBar";
import FilterField from "../components/FilterField";
import { reportCellStyle } from "../components/reportStyles";
import ReportTableCard from "../components/ReportTableCard";

const GENDER_COLORS = [T.primary, "#F0A93A", "#1FAE6E", "#8A93AC"];

export default function ReportGenero() {
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
