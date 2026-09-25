import { useState } from "react";
import { Pill } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { filterInputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import { mostRecentBrDate } from "../../../utils/date";
import FilterBar from "../components/FilterBar";
import FilterField from "../components/FilterField";
import { reportCellStyle } from "../components/reportStyles";
import ReportTableCard from "../components/ReportTableCard";

export default function ReportComProntuario() {
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
