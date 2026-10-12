import { ArrowLeft } from "lucide-react";
import { T } from "../../styles/theme";

/* Botão "Voltar" padrão das telas internas. */
export default function BackButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px 9px 12px", marginBottom: 16,
        background: T.primaryTint, color: T.primaryDark, border: `1px solid ${T.primary}`, borderRadius: 999,
        fontSize: 14.5, fontWeight: 700, cursor: "pointer", transition: "background .15s, color .15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = T.primary; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = T.primaryTint; e.currentTarget.style.color = T.primaryDark; }}
    >
      <ArrowLeft size={19} /> {children}
    </button>
  );
}
