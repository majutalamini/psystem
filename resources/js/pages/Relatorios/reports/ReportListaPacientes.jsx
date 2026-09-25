import { useState } from "react";
import { Pill } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { filterInputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import FilterBar from "../components/FilterBar";
import FilterField from "../components/FilterField";
import { reportCellStyle } from "../components/reportStyles";
import ReportTableCard from "../components/ReportTableCard";

export default function ReportListaPacientes() {
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
