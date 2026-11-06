import { ChevronLeft, ChevronRight } from "lucide-react";
import { iconBtn } from "../../styles/formStyles";
import { T } from "../../styles/theme";

export default function Pagination({ pagination, onPage, label = "registros" }) {
  const { page, lastPage, total, from, to } = pagination;
  return (
    <nav aria-label={`Paginação de ${label}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "14px 16px", fontSize: 13, color: T.muted }}>
      <span>Página <strong style={{ color: T.text }}>{page}</strong> de {lastPage}</span>
      <span>{total ? `${from}–${to}` : "0"} de {total}</span>
      <div style={{ display: "flex", gap: 4 }}>
        <button type="button" aria-label={`Página anterior de ${label}`} disabled={page <= 1} onClick={() => onPage(page - 1)} style={{ ...iconBtn, opacity: page <= 1 ? .4 : 1 }}><ChevronLeft size={19} /></button>
        <button type="button" aria-label={`Próxima página de ${label}`} disabled={page >= lastPage} onClick={() => onPage(page + 1)} style={{ ...iconBtn, opacity: page >= lastPage ? .4 : 1 }}><ChevronRight size={19} /></button>
      </div>
    </nav>
  );
}
