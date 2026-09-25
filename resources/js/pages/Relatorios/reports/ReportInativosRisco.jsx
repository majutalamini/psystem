import { useState } from "react";
import { Pill } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { filterInputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import { daysBetweenBr } from "../../../utils/date";
import FilterBar from "../components/FilterBar";
import FilterField from "../components/FilterField";
import { reportCellStyle } from "../components/reportStyles";
import ReportTableCard from "../components/ReportTableCard";

export default function ReportInativosRisco() {
  const { patients } = useAppData();
  const [threshold, setThreshold] = useState(30);
  const [applied, setApplied] = useState(30);

  const rows = patients
    .map((p) => ({ ...p, diasSemSessao: daysBetweenBr(p.lastSession) }))
    .filter((p) => p.status === "Inativo" || p.diasSemSessao >= applied)
    .sort((a, b) => b.diasSemSessao - a.diasSemSessao);

  return (
    <div>
      <FilterBar onApply={() => setApplied(threshold)}>
        <FilterField label="Risco a partir de (dias sem sessão)">
          <input type="number" min={1} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} style={{ ...filterInputStyle, minWidth: 100 }} />
        </FilterField>
      </FilterBar>

      <ReportTableCard
        countLabel={<>Pacientes inativos ou em risco: <strong>{rows.length}</strong></>}
        columns={["Paciente", "Situação", "Última sessão", "Dias sem sessão", "Classificação"]}
        rows={rows}
        emptyText="Nenhum paciente inativo ou em risco de abandono."
        renderRow={(p, i) => (
          <tr key={p.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{p.name}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={p.status === "Ativo" ? "success" : "muted"}>{p.status}</Pill></td>
            <td style={reportCellStyle}>{p.lastSession}</td>
            <td style={reportCellStyle}>{p.diasSemSessao}</td>
            <td style={{ padding: "14px 20px" }}>
              <Pill tone={p.status === "Inativo" ? "muted" : "warn"}>{p.status === "Inativo" ? "Inativo" : "Risco de abandono"}</Pill>
            </td>
          </tr>
        )}
      />
    </div>
  );
}
