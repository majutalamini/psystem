import { Pill } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { T } from "../../../styles/theme";
import { TODAY, daysBetweenBr, parseBrDate } from "../../../utils/date";
import { reportCellStyle } from "../components/reportStyles";
import ReportTableCard from "../components/ReportTableCard";

export default function ReportInadimplencia() {
  const { receivables } = useAppData();
  const rows = receivables
    .filter((r) => r.status !== "Pago" && (r.status === "Atrasado" || parseBrDate(r.vencimento) < TODAY))
    .map((r) => ({ ...r, diasAtraso: Math.max(daysBetweenBr(r.vencimento), 0) }))
    .sort((a, b) => b.diasAtraso - a.diasAtraso);

  const total = rows.reduce((s, r) => s + r.valor, 0);

  return (
    <ReportTableCard
      countLabel={<>Total em atraso: <strong>R$ {total.toLocaleString("pt-BR")}</strong> &nbsp;·&nbsp; {rows.length} cobrança(s)</>}
      columns={["Paciente", "Referência", "Valor", "Vencimento", "Dias em atraso"]}
      rows={rows}
      emptyText="Nenhuma cobrança em atraso."
      renderRow={(r, i) => (
        <tr key={r.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
          <td style={{ ...reportCellStyle, fontWeight: 600 }}>{r.paciente}</td>
          <td style={reportCellStyle}>{r.referencia}</td>
          <td style={reportCellStyle}>R$ {r.valor.toLocaleString("pt-BR")}</td>
          <td style={reportCellStyle}>{r.vencimento}</td>
          <td style={{ padding: "14px 20px" }}><Pill tone="danger">{r.diasAtraso} dias</Pill></td>
        </tr>
      )}
    />
  );
}
