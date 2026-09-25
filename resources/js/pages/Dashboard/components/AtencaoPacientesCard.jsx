import { ChevronRight } from "lucide-react";
import { Avatar, Card, Pill } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { T } from "../../../styles/theme";

export default function AtencaoPacientesCard({ onNavigate }) {
  const { patients } = useAppData();
  const attention = patients
    .filter((p) => p.status === "Inativo")
    .map((p) => ({ ...p, reason: "Inativo — sem sessões recentes" }));

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Pacientes que precisam de atenção</span>
        <Pill tone="warn">{attention.length}</Pill>
      </div>
      {attention.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: T.muted }}>Nenhum paciente pendente de retorno.</div>
      ) : (
        <div>
          {attention.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: i < attention.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <Avatar initials={p.initials} color={p.color} size={34} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>{p.name}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{p.reason} · última sessão {p.lastSession}</div>
              </div>
              <button
                onClick={() => onNavigate("prontuarios")}
                style={{ fontSize: 12.5, fontWeight: 700, color: T.primaryDark, background: T.primaryTint, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}
              >
                Ver prontuário
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: "12px 20px" }}>
        <button onClick={() => onNavigate("pacientes")} style={{ background: "none", border: "none", color: T.primary, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
          Ver todos os pacientes <ChevronRight size={16} />
        </button>
      </div>
    </Card>
  );
}
