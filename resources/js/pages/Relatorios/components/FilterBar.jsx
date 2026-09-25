import { Card } from "../../../components/ui";
import { T } from "../../../styles/theme";

export default function FilterBar({ children, onApply }) {
  return (
    <Card style={{ padding: "16px 20px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 22, flexWrap: "wrap" }}>
        {children}
        <button
          onClick={onApply}
          style={{ background: "none", border: "none", color: T.primary, fontWeight: 700, fontSize: 13, cursor: "pointer", textTransform: "uppercase", letterSpacing: 0.3, padding: "10px 0" }}
        >
          Aplicar filtros
        </button>
      </div>
    </Card>
  );
}
