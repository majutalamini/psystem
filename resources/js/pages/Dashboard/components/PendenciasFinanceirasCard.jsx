import { ChevronRight } from "lucide-react";
import { Card, Pill } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { T } from "../../../styles/theme";
import { statusTone } from "../../../utils/format";

export default function PendenciasFinanceirasCard({ onNavigate }) {
  const { receivables } = useAppData();
  const pendentes = receivables.filter((r) => r.status !== "Pago").slice(0, 4);
  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Pendências financeiras</span>
        <Pill tone="danger">{pendentes.length} em aberto</Pill>
      </div>
      {pendentes.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: T.muted }}>Nenhuma pendência no momento.</div>
      ) : (
        <div>
          {pendentes.map((r, i) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: i < pendentes.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>{r.paciente}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{r.referencia} · vence {r.vencimento}</div>
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>R$ {r.valor.toLocaleString("pt-BR")}</span>
              <Pill tone={statusTone(r.status)}>{r.status}</Pill>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: "12px 20px" }}>
        <button onClick={() => onNavigate("financeiro")} style={{ background: "none", border: "none", color: T.primary, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
          Ver financeiro completo <ChevronRight size={16} />
        </button>
      </div>
    </Card>
  );
}
