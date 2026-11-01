import { createContext, useContext, useRef } from "react";
import { Download, Printer } from "lucide-react";
import { Card } from "../../../components/ui";
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

  /* Lê o que está na tela (já filtrado e formatado), então impressão e arquivo saem iguais ao que se vê. */
  function lerTabela() {
    const linhas = [...tabelaRef.current.querySelectorAll("tbody tr")]
      .map((tr) => [...tr.children].map((td) => td.innerText.replace(/\s+/g, " ").trim()))
      .filter((l) => l.length === columns.length);
    return { linhas, resumo: resumoRef.current?.innerText.replace(/\s+/g, " ").trim() };
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
          ) : rows.map(renderRow)}
        </tbody>
      </table>
    </Card>
  );
}
