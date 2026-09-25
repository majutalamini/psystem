import { useState } from "react";
import { Pill } from "../../../components/ui";
import { initialPayables } from "../../../data/finance";
import { filterInputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import { statusTone } from "../../../utils/format";
import FilterBar from "../components/FilterBar";
import FilterField from "../components/FilterField";
import { reportCellStyle } from "../components/reportStyles";
import ReportTableCard from "../components/ReportTableCard";

export default function ReportContasPagar() {
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [applied, setApplied] = useState("Todos");

  const rows = initialPayables.filter((p) => applied === "Todos" || p.status === applied);
  const total = rows.reduce((s, p) => s + p.valor, 0);

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
        columns={["Descrição", "Categoria", "Valor", "Vencimento", "Status"]}
        rows={rows}
        emptyText="Nenhuma conta a pagar encontrada."
        renderRow={(p, i) => (
          <tr key={p.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{p.descricao}</td>
            <td style={reportCellStyle}>{p.categoria}</td>
            <td style={reportCellStyle}>R$ {p.valor.toLocaleString("pt-BR")}</td>
            <td style={reportCellStyle}>{p.vencimento}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={statusTone(p.status)}>{p.status}</Pill></td>
          </tr>
        )}
      />
    </div>
  );
}
