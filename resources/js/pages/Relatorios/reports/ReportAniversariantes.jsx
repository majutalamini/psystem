import { useState } from "react";
import { Cake } from "lucide-react";
import { Pill, Switch } from "../../../components/ui";
import { MONTHS_PT } from "../../../data/reports";
import { useAppData } from "../../../hooks/useAppData";
import { filterInputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import { TODAY, parseBrDate } from "../../../utils/date";
import FilterBar from "../components/FilterBar";
import FilterField from "../components/FilterField";
import { reportCellStyle } from "../components/reportStyles";
import ReportTableCard from "../components/ReportTableCard";

export default function ReportAniversariantes() {
  const { patients } = useAppData();
  const [month, setMonth] = useState(TODAY.getMonth());
  const [includeInactive, setIncludeInactive] = useState(true);
  const [applied, setApplied] = useState({ month: TODAY.getMonth(), includeInactive: true });

  const rows = patients
    .filter((p) => {
      const d = parseBrDate(p.nascimento);
      if (!d || d.getMonth() !== applied.month) return false;
      if (!applied.includeInactive && p.status !== "Ativo") return false;
      return true;
    })
    .sort((a, b) => parseBrDate(a.nascimento).getDate() - parseBrDate(b.nascimento).getDate());

  return (
    <div>
      <FilterBar onApply={() => setApplied({ month, includeInactive })}>
        <FilterField label="Mês">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ ...filterInputStyle, minWidth: 150 }}>
            {MONTHS_PT.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        </FilterField>
        <FilterField label="Incluir inativos">
          <div style={{ padding: "9px 0" }}>
            <Switch checked={includeInactive} onChange={setIncludeInactive} />
          </div>
        </FilterField>
      </FilterBar>

      <ReportTableCard
        countLabel={<>Aniversariantes em {MONTHS_PT[applied.month]}: <strong>{rows.length}</strong></>}
        columns={["Paciente", "Telefone", "Data de nascimento", "Situação"]}
        rows={rows}
        emptyText="Nenhum aniversariante encontrado para o mês selecionado."
        renderRow={(p, i) => (
          <tr key={p.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <td style={{ ...reportCellStyle, fontWeight: 600 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Cake size={15} color={T.primary} /> {p.name}</span></td>
            <td style={reportCellStyle}>{p.phone}</td>
            <td style={reportCellStyle}>{p.nascimento}</td>
            <td style={{ padding: "14px 20px" }}><Pill tone={p.status === "Ativo" ? "success" : "muted"}>{p.status}</Pill></td>
          </tr>
        )}
      />
    </div>
  );
}
