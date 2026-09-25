import { useState } from "react";
import { CalendarClock, Check, RefreshCw, X } from "lucide-react";
import { MiniStat, Pill } from "../../../components/ui";
import { initialSessions } from "../../../data/sessions";
import { filterInputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import { parseBrDate } from "../../../utils/date";
import { sessionStatusTone } from "../../../utils/format";
import FilterBar from "../components/FilterBar";
import FilterField from "../components/FilterField";
import { reportCellStyle } from "../components/reportStyles";
import ReportTableCard from "../components/ReportTableCard";

export default function ReportSessoesRealizadasAgendadas() {
  const defaultFrom = "01/07/2026";
  const defaultTo = "31/08/2026";
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [applied, setApplied] = useState({ from: defaultFrom, to: defaultTo });

  const from = parseBrDate(applied.from);
  const to = parseBrDate(applied.to);

  const rows = initialSessions
    .filter((s) => { const d = parseBrDate(s.data); return d && (!from || d >= from) && (!to || d <= to); })
    .sort((a, b) => parseBrDate(b.data) - parseBrDate(a.data));

  const counts = ["Realizada", "Agendada", "Falta", "Cancelada"].reduce((acc, st) => {
    acc[st] = rows.filter((s) => s.status === st).length;
    return acc;
  }, {});

  return (
    <div>
      <FilterBar onApply={() => setApplied({ from: dateFrom, to: dateTo })}>
        <FilterField label="Data inicial">
          <input value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="dd/mm/aaaa" style={{ ...filterInputStyle, minWidth: 130 }} />
        </FilterField>
        <FilterField label="Data final">
          <input value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="dd/mm/aaaa" style={{ ...filterInputStyle, minWidth: 130 }} />
        </FilterField>
      </FilterBar>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <MiniStat label="Realizadas" value={counts.Realizada} icon={Check} tone="success" />
        <MiniStat label="Agendadas" value={counts.Agendada} icon={CalendarClock} tone="primary" />
        <MiniStat label="Faltas" value={counts.Falta} icon={X} tone="danger" />
        <MiniStat label="Canceladas" value={counts.Cancelada} icon={RefreshCw} tone="danger" />
      </div>

      <ReportTableCard
        countLabel={<>Sessões no período: <strong>{rows.length}</strong></>}
        columns={["Data", "Paciente", "Status"]}
        rows={rows}
        emptyText="Nenhuma sessão encontrada no período selecionado."
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
