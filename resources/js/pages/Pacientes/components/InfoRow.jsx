import { T } from "../../../styles/theme";

export default function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 0", borderBottom: `1px solid ${T.border}` }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color={T.primary} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 15.5, color: T.text, fontWeight: 600 }}>{value || "Não informado"}</div>
      </div>
    </div>
  );
}
