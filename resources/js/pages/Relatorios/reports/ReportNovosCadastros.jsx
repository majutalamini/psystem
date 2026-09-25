import { useState } from "react";
import { Pill } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { filterInputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import { parseBrDate } from "../../../utils/date";
import FilterBar from "../components/FilterBar";
import FilterField from "../components/FilterField";
import { reportCellStyle } from "../components/reportStyles";
import ReportTableCard from "../components/ReportTableCard";

export default function ReportNovosCadastros() {
  const { patients } = useAppData();
  const defaultFrom = "17/08/2025";
  const defaultTo = "17/08/2026";
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [applied, setApplied] = useState({ from: defaultFrom, to: defaultTo });

  const from = parseBrDate(applied.from);
  const to = parseBrDate(applied.to);

  const rows = patients
    .filter((p) => {
      const d = parseBrDate(p.cadastro);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    })
    .sort((a, b) => parseBrDate(b.cadastro) - parseBrDate(a.cadastro));

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

      <ReportTableCard
        countLabel={<>Novos cadastros no período: <strong>{rows.length}</strong></>}
        columns={["Paciente", "Data de cadastro", "Convênio", "Situação"]}
        rows={rows}
        emptyText="Nenhum cadastro novo no período selecionado."
        renderRow={(p, i) => (
          <tr key={p.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}>{p.name}</td>
            <td style={reportCellStyle}>{p.cadastro}</td>
            <td style={reportCellStyle}>{p.convenio || "—"}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={p.status === "Ativo" ? "success" : "muted"}>{p.status}</Pill></td>
          </tr>
        )}
      />
    </div>
  );
}
