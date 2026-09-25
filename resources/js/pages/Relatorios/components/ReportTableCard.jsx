import { Download, Printer } from "lucide-react";
import { Card } from "../../../components/ui";
import { iconBtn } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";

export default function ReportTableCard({ countLabel, columns, rows, emptyText, renderRow }) {
  return (
    <Card style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 13.5, color: T.text }}>{countLabel}</span>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...iconBtn, background: "#fff" }} title="Imprimir"><Printer size={20} /></button>
          <button style={{ ...iconBtn, background: "#fff" }} title="Exportar"><Download size={20} /></button>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#FAFBFE", textAlign: "left" }}>
            {columns.map((h) => (
              <th key={h} style={{ padding: "12px 20px", fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ padding: 24, fontSize: 13.5, color: T.muted }}>{emptyText}</td></tr>
          ) : rows.map(renderRow)}
        </tbody>
      </table>
    </Card>
  );
}
