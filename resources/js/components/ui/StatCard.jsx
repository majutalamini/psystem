import { T } from "../../styles/theme";
import { Card } from "./";

export default function StatCard({ label, value, delta, deltaTone = "success", icon: Icon, tone = "primary" }) {
  const toneMap = {
    primary: { bg: T.primaryTint, icon: T.primary },
    success: { bg: T.successTint, icon: T.success },
    warn: { bg: T.warnTint, icon: "#9C7A16" },
    danger: { bg: T.dangerTint, icon: T.danger },
  };
  const c = toneMap[tone] || toneMap.primary;
  return (
    <Card style={{ padding: 18, flex: 1, minWidth: 190 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>{label}</span>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={23} color={c.icon} />
        </div>
      </div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 800, color: T.text }}>{value}</div>
      {delta && (
        <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 600, color: deltaTone === "success" ? T.success : T.danger }}>
          {delta}
        </div>
      )}
    </Card>
  );
}
