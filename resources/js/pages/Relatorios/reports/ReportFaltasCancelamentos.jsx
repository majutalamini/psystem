import { useState } from "react";
import { Pill } from "../../../components/ui";
import { initialSessions } from "../../../data/sessions";
import { useAppData } from "../../../hooks/useAppData";
import { filterInputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import { parseBrDate } from "../../../utils/date";
import { sessionStatusTone } from "../../../utils/format";
import FilterBar from "../components/FilterBar";
import FilterField from "../components/FilterField";
import { reportCellStyle } from "../components/reportStyles";
import ReportTableCard from "../components/ReportTableCard";

export default function ReportFaltasCancelamentos() {
  const { patients } = useAppData();
  const defaultFrom = "01/06/2026";
  const defaultTo = "31/08/2026";
  const [patientFilter, setPatientFilter] = useState("Todos");
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [applied, setApplied] = useState({ patient: "Todos", from: defaultFrom, to: defaultTo });

  const from = parseBrDate(applied.from);
  const to = parseBrDate(applied.to);

  const rows = initialSessions
    .filter((s) => s.status === "Falta" || s.status === "Cancelada")
    .filter((s) => applied.patient === "Todos" || s.paciente === applied.patient)
    .filter((s) => { const d = parseBrDate(s.data); return d && (!from || d >= from) && (!to || d <= to); })
    .sort((a, b) => parseBrDate(b.data) - parseBrDate(a.data));

  const faltas = rows.filter((s) => s.status === "Falta").length;
  const cancelamentos = rows.filter((s) => s.status === "Cancelada").length;

  return (
    <div>
      <FilterBar onApply={() => setApplied({ patient: patientFilter, from: dateFrom, to: dateTo })}>
        <FilterField label="Paciente">
          <select value={patientFilter} onChange={(e) => setPatientFilter(e.target.value)} style={{ ...filterInputStyle, minWidth: 170 }}>
            <option>Todos</option>
            {patients.map((p) => <option key={p.id}>{p.name}</option>)}
          </select>
        </FilterField>
        <FilterField label="Data inicial">
          <input value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="dd/mm/aaaa" style={{ ...filterInputStyle, minWidth: 130 }} />
        </FilterField>
        <FilterField label="Data final">
          <input value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="dd/mm/aaaa" style={{ ...filterInputStyle, minWidth: 130 }} />
        </FilterField>
      </FilterBar>

      <ReportTableCard
        countLabel={<>Faltas: <strong>{faltas}</strong> &nbsp;·&nbsp; Cancelamentos: <strong>{cancelamentos}</strong></>}
        columns={["Data", "Paciente", "Status"]}
        rows={rows}
        emptyText="Nenhuma falta ou cancelamento encontrado para os filtros selecionados."
        renderRow={(s, i) => (
          <tr key={s.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={reportCellStyle}>{s.data}</td>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{s.paciente}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={sessionStatusTone(s.status)}>{s.status}</Pill></td>
          </tr>
        )}
      />
    </div>
  );
}
