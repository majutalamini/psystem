import { createContext, useContext, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Download, Printer } from "lucide-react";
import { Card, Pagination } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { iconBtn } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import { baixarCsv, imprimirTabela } from "../../../utils/imprimir";

/* Relatorios.jsx informa o nome do relatório aberto; ele vira o título do papel e do arquivo. */
export const ReportTitleContext = createContext("Relatório");

export default function ReportTableCard({ countLabel, columns, rows, emptyText, renderRow }) {
  const { auth } = useAppData();
  const titulo = useContext(ReportTitleContext);
  const tabelaRef = useRef(null);
  const resumoRef = useRef(null);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const signature = rows.map((row, index) => row.id ?? row.name ?? row.label ?? index).join("\u001f");
  useEffect(() => setPage(1), [signature]);
  const lastPage = Math.max(1, Math.ceil(rows.length / 50)), currentPage = Math.min(page, lastPage);
  const visibleRows = exporting ? rows : rows.slice((currentPage - 1) * 50, currentPage * 50);

  /* Lê o que está na tela (já filtrado e formatado), então impressão e arquivo saem iguais ao que se vê. */
  function lerTabela() {
    // Só a ação explícita de imprimir/exportar materializa todas as linhas
    // formatadas. O arquivo nunca é limitado à página visível.
    flushSync(() => setExporting(true));
    try {
      const linhas = [...tabelaRef.current.querySelectorAll("tbody tr")]
        .map((tr) => [...tr.children].map((td) => td.innerText.replace(/\s+/g, " ").trim()))
        .filter((l) => l.length === columns.length);
      return { linhas, resumo: resumoRef.current?.innerText.replace(/\s+/g, " ").trim() };
    } finally { flushSync(() => setExporting(false)); }
  }

  const imprimir = () => {
    const { linhas, resumo } = lerTabela();
    imprimirTabela(titulo, columns, linhas, auth.user, resumo);
  };
  const exportar = () => baixarCsv(titulo, columns, lerTabela().linhas);

  return (
    <Card style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
        <span ref={resumoRef} style={{ fontSize: 13.5, color: T.text }}>{countLabel}</span>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={imprimir} style={{ ...iconBtn, background: T.surface }} title="Imprimir"><Printer size={20} /></button>
          <button onClick={exportar} style={{ ...iconBtn, background: T.surface }} title="Baixar em planilha (CSV)"><Download size={20} /></button>
        </div>
      </div>
      <table ref={tabelaRef} style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: T.surfaceAlt, textAlign: "left" }}>
            {columns.map((h) => (
              <th key={h} style={{ padding: "12px 20px", fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ padding: 24, fontSize: 13.5, color: T.muted }}>{emptyText}</td></tr>
          ) : visibleRows.map(renderRow)}
        </tbody>
      </table>
      <Pagination label="linhas do relatório" onPage={setPage} pagination={{ page: currentPage, lastPage, total: rows.length,
        from: rows.length ? (currentPage - 1) * 50 + 1 : null, to: Math.min(currentPage * 50, rows.length), perPage: 50 }} />
    </Card>
  );
}
