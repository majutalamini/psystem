import { useAppData } from "../../../hooks/useAppData";
import { T } from "../../../styles/theme";
import { reportCellStyle } from "../components/reportStyles";
import ReportTableCard from "../components/ReportTableCard";

/* ocupacao: uma linha por dia da semana atual, com as consultas marcadas e os horários do expediente. */
export default function ReportOcupacao() {
  const { ocupacao } = useAppData();
  const rows = ocupacao.map((d) => ({
    ...d,
    livres: Math.max(d.total - d.preenchidos, 0),
    pct: d.total ? Math.min(Math.round((d.preenchidos / d.total) * 100), 100) : 0,
  }));

  return (
    <ReportTableCard
      countLabel={<>Semana atual · dias analisados: <strong>{rows.length}</strong></>}
      columns={["Dia", "Horários preenchidos", "Horários livres", "Ocupação"]}
      rows={rows}
      emptyText="Nenhum dado de agenda disponível."
      renderRow={(r, i) => (
        <tr key={r.label} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
          <td style={{ ...reportCellStyle, fontWeight: 600 }}>{r.label}</td>
          <td style={reportCellStyle}>{r.preenchidos} / {r.total}</td>
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
