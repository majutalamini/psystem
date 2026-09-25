import { Card } from "../../../components/ui";
import { FONT_DISPLAY, T, WA_GREEN_DARK } from "../../../styles/theme";

export default function SettingsSection({ title, description, icon: Icon, action, children, tone = "primary" }) {
  const tones = {
    primary: { bg: T.primaryTint, fg: T.primary },
    success: { bg: T.successTint, fg: T.success },
    warn: { bg: T.warnTint, fg: "#9C7A16" },
    whatsapp: { bg: "#E7F9EE", fg: WA_GREEN_DARK },
  };
  const c = tones[tone] || tones.primary;
  return (
    <Card style={{ padding: 30, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 15, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap" }}>
        {Icon && (
          <div style={{ width: 46, height: 46, borderRadius: 13, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={23} color={c.fg} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, letterSpacing: -0.3, color: T.text }}>{title}</div>
          {description && <div style={{ fontSize: 14, color: T.muted, marginTop: 4, lineHeight: 1.55, maxWidth: 560 }}>{description}</div>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}
