import { T } from "../../styles/theme";

export default function MiniStat({ label, value, icon: Icon, tone = "primary" }) {
  const toneMap = {
    primary: { bg: T.primaryTint, c: T.primary },
    success: { bg: T.successTint, c: T.success },
    danger: { bg: T.dangerTint, c: T.danger },
  };
  const t = toneMap[tone] || toneMap.primary;
  return (
    <div style={{ background: "#FAFBFE", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
        <div style={{ width: 20, height: 20, borderRadius: 6, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} color={t.c} />
        </div>
        <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{value}</div>
    </div>
  );
}
