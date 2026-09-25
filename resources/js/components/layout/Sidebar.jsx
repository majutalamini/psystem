import { usePage } from "@inertiajs/react";
import { NAV } from "../../data/navigation";
import { navigate, pageFromUrl } from "../../utils/nav";
import { FONT_DISPLAY, T } from "../../styles/theme";

export default function Sidebar() {
  const activePage = pageFromUrl(usePage().url);
  return (
    <aside
      style={{
        width: 268, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column", height: "100%",
      }}
    >
      <nav style={{ flex: 1, padding: "22px 14px 6px", display: "flex", flexDirection: "column", gap: 6 }}>
        {NAV.map((item) => {
          const active = activePage === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              style={{
                display: "flex", alignItems: "center", gap: 16, padding: "15px 14px 15px 12px",
                borderRadius: 11, borderTopLeftRadius: active ? 0 : 11, borderBottomLeftRadius: active ? 0 : 11,
                border: "none", borderLeft: active ? `4px solid ${T.primary}` : "4px solid transparent",
                cursor: "pointer", fontFamily: FONT_DISPLAY, fontSize: 17.5,
                fontWeight: active ? 700 : 500, letterSpacing: -0.25,
                background: active ? T.primaryTint : "transparent", color: active ? T.primaryDark : T.text,
                textAlign: "left", width: "100%", transition: "background .12s, color .12s",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#F5F6FA"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={26} strokeWidth={active ? 2.4 : 1.9} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
