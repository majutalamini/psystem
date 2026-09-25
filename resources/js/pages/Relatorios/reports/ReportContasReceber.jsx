import { useState } from "react";
import { Pill } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { filterInputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import { statusTone } from "../../../utils/format";
import FilterBar from "../components/FilterBar";
import FilterField from "../components/FilterField";
import { reportCellStyle } from "../components/reportStyles";
import ReportTableCard from "../components/ReportTableCard";

export default function ReportContasReceber() {
  const { receivables } = useAppData();
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [applied, setApplied] = useState("Todos");

  const rows = receivables.filter((r) => applied === "Todos" || r.status === applied);
  const total = rows.reduce((s, r) => s + r.valor, 0);

  return (
    <div>
      <FilterBar onApply={() => setApplied(statusFilter)}>
        <FilterField label="Status">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...filterInputStyle, minWidth: 150 }}>
            {["Todos", "Pago", "Pendente", "Atrasado"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </FilterField>
      </FilterBar>

      <ReportTableCard
        countLabel={<>Total: <strong>R$ {total.toLocaleString("pt-BR")}</strong> &nbsp;·&nbsp; {rows.length} lançamento(s)</>}
        columns={["Paciente", "Referência", "Valor", "Vencimento", "Status"]}
        rows={rows}
        emptyText="Nenhuma conta a receber encontrada."
        renderRow={(r, i) => (
          <tr key={r.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{r.paciente}</td>
            <td style={reportCellStyle}>{r.referencia}</td>
            <td style={reportCellStyle}>R$ {r.valor.toLocaleString("pt-BR")}</td>
            <td style={reportCellStyle}>{r.vencimento}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={statusTone(r.status)}>{r.status}</Pill></td>
          </tr>
        )}
      />
    </div>
  );
}
