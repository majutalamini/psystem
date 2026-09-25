import { useState } from "react";
import { Pill } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { filterInputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import FilterBar from "../components/FilterBar";
import FilterField from "../components/FilterField";
import { reportCellStyle } from "../components/reportStyles";
import ReportTableCard from "../components/ReportTableCard";

export default function ReportSemAnamnese() {
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
