import { HOURS, WEEKDAY_FULL, weekSchedules } from "../../../data/agenda";
import { T } from "../../../styles/theme";
import { weekdayIndex } from "../../../utils/date";
import { reportCellStyle } from "../components/reportStyles";
import ReportTableCard from "../components/ReportTableCard";

export default function ReportOcupacao() {
  const offsets = Object.keys(weekSchedules).map(Number).sort((a, b) => a - b);
  const rows = offsets.map((offset) => {
    const events = weekSchedules[offset];
    const preenchidos = events.length;
    const livres = Math.max(HOURS.length - preenchidos, 0);
    const pct = Math.round((preenchidos / HOURS.length) * 100);
    return { offset, label: WEEKDAY_FULL[weekdayIndex(offset)], preenchidos, livres, pct };
  });

  return (
    <ReportTableCard
      countLabel={<>Dias analisados: <strong>{rows.length}</strong></>}
      columns={["Dia", "Horários preenchidos", "Horários livres", "Ocupação"]}
      rows={rows}
      emptyText="Nenhum dado de agenda disponível."
      renderRow={(r, i) => (
        <tr key={r.offset} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
          <td style={{ ...reportCellStyle, fontWeight: 600 }}>{r.label}</td>
          <td style={reportCellStyle}>{r.preenchidos} / {HOURS.length}</td>
          <td style={reportCellStyle}>{r.livres}</td>
          <td style={{ padding: "14px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 90, height: 8, borderRadius: 999, background: T.primaryTint, overflow: "hidden" }}>
                <div style={{ width: `${r.pct}%`, height: "100%", background: T.primary, borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{r.pct}%</span>
            </div>
          </td>
        </tr>
      )}
    />
  );
}
