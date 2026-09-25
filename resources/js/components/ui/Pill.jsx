import { T } from "../../styles/theme";

export default function Pill({ children, tone = "primary" }) {
  const map = {
    primary: { bg: T.primaryTint, text: T.primaryDark },
    success: { bg: T.successTint, text: T.success },
    danger: { bg: T.dangerTint, text: T.danger },
    warn: { bg: T.warnTint, text: "#8A6413" },
    muted: { bg: "#F1F3F9", text: T.muted },
  };
  const c = map[tone];
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}
