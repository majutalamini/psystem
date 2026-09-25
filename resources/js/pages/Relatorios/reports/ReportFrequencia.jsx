import { initialSessions } from "../../../data/sessions";
import { T } from "../../../styles/theme";
import { parseBrDate } from "../../../utils/date";
import { reportCellStyle } from "../components/reportStyles";
import ReportTableCard from "../components/ReportTableCard";

export default function ReportFrequencia() {
  const patientNames = Array.from(new Set(initialSessions.map((s) => s.paciente)));

  const rows = patientNames.map((name) => {
    const realized = initialSessions
      .filter((s) => s.paciente === name && s.status === "Realizada")
      .map((s) => parseBrDate(s.data))
      .sort((a, b) => a - b);
    let avgInterval = null;
    if (realized.length > 1) {
      const diffs = realized.slice(1).map((d, i) => Math.round((d - realized[i]) / 86400000));
      avgInterval = Math.round(diffs.reduce((s, v) => s + v, 0) / diffs.length);
    }
    return {
      name,
      count: realized.length,
      avgInterval,
      last: realized.length ? realized[realized.length - 1].toLocaleDateString("pt-BR") : "—",
    };
  }).sort((a, b) => b.count - a.count);

  return (
    <ReportTableCard
      countLabel={<>Pacientes com sessões realizadas: <strong>{rows.length}</strong></>}
      columns={["Paciente", "Sessões realizadas", "Intervalo médio", "Última sessão realizada"]}
      rows={rows}
      emptyText="Nenhuma sessão realizada encontrada."
      renderRow={(r, i) => (
        <tr key={r.name} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
          <td style={{ ...reportCellStyle, fontWeight: 600 }}>{r.name}</td>
          <td style={reportCellStyle}>{r.count}</td>
          <td style={reportCellStyle}>{r.avgInterval != null ? `${r.avgInterval} dias` : "—"}</td>
          <td style={reportCellStyle}>{r.last}</td>
        </tr>
      )}
    />
  );
}
