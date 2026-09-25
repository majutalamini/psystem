import { useState } from "react";
import { useAppData } from "../../../hooks/useAppData";
import { filterInputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import FilterBar from "../components/FilterBar";
import FilterField from "../components/FilterField";
import { reportCellStyle } from "../components/reportStyles";
import ReportTableCard from "../components/ReportTableCard";

export default function ReportRecebimentoPaciente() {
  const { receivables } = useAppData();
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");

  const names = Array.from(new Set(receivables.map((r) => r.paciente)));
  const rows = names
    .map((name) => {
      const paid = receivables.filter((r) => r.paciente === name && r.status === "Pago");
      const total = paid.reduce((s, r) => s + r.valor, 0);
      return { name, total, count: paid.length };
    })
    .filter((r) => r.count > 0)
    .filter((r) => !applied || r.name.toLowerCase().includes(applied.toLowerCase()))
    .sort((a, b) => b.total - a.total);

  const total = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div>
      <FilterBar onApply={() => setApplied(query)}>
        <FilterField label="Paciente">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome" style={filterInputStyle} />
        </FilterField>
      </FilterBar>

      <ReportTableCard
        countLabel={<>Total recebido: <strong>R$ {total.toLocaleString("pt-BR")}</strong></>}
        columns={["Paciente", "Cobranças pagas", "Total recebido"]}
        rows={rows}
        emptyText="Nenhum recebimento encontrado para o paciente pesquisado."
        renderRow={(r, i) => (
          <tr key={r.name} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{r.name}</td>
            <td style={reportCellStyle}>{r.count}</td>
            <td style={reportCellStyle}>R$ {r.total.toLocaleString("pt-BR")}</td>
          </tr>
        )}
      />
    </div>
  );
}
