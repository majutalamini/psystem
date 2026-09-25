import { CalendarDays, ClipboardList, Edit3 } from "lucide-react";
import { iconBtn } from "../../styles/formStyles";
import { T } from "../../styles/theme";
import { Card } from "../ui";

const recordLabelStyle = {
  fontSize: 12.5, fontWeight: 700, color: T.muted, textTransform: "uppercase",
  letterSpacing: 0.4, marginBottom: 6,
};

const recordTextStyle = { fontSize: 15.5, color: T.text, lineHeight: 1.75 };

export default function RecordCard({ entry, onEdit }) {
  return (
    <Card style={{ padding: 28, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 14, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ClipboardList size={23} color={T.primary} />
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18.5, color: T.text }}>{entry.sessao || "Sessão"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: T.muted, marginTop: 3 }}>
              <CalendarDays size={16} /> {entry.date}
            </div>
          </div>
        </div>
        <button onClick={onEdit} style={{ ...iconBtn, width: 44, height: 44, background: "#fff" }} title="Editar registro"><Edit3 size={21} /></button>
      </div>
      {entry.tecnicas && (
        <div style={{ marginBottom: 18 }}>
          <div style={recordLabelStyle}>Técnicas utilizadas</div>
          <div style={recordTextStyle}>{entry.tecnicas}</div>
        </div>
      )}
      {entry.objetivo && (
        <div style={{ marginBottom: 18 }}>
          <div style={recordLabelStyle}>Objetivo da sessão</div>
          <div style={recordTextStyle}>{entry.objetivo}</div>
        </div>
      )}
      <div>
        <div style={recordLabelStyle}>Descrição / relato de atendimento</div>
        <div style={{ ...recordTextStyle, whiteSpace: "pre-wrap" }}>{entry.descricao || "—"}</div>
      </div>
    </Card>
  );
}
