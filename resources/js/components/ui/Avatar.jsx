import { EVENT_STYLES } from "../../styles/theme";

export default function Avatar({ initials, size = 36, color = "purple", src = null, style = {} }) {
  const c = EVENT_STYLES[color] || EVENT_STYLES.purple;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: c.bg, color: c.text, border: `1px solid ${c.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: size * 0.36, flexShrink: 0,
        overflow: "hidden", ...style,
      }}
    >
      {src
        ? <img src={src} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials}
    </div>
  );
}
