import { useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import { T } from "../../styles/theme";

/* Menu de ações de linha (⋮) — posicionado em `fixed` para não ser
   cortado por tabelas com overflow hidden. */
export default function RowMenu({ items }) {
  const btnRef = useRef(null);
  const [pos, setPos] = useState(null);

  function toggle() {
    if (pos) { setPos(null); return; }
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: Math.max(12, r.right - 230) });
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex" }}
        title="Mais ações"
      >
        <MoreVertical size={19} />
      </button>
      {pos && (
        <>
          <div onClick={() => setPos(null)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
          <div style={{ position: "fixed", top: pos.top, left: pos.left, width: 230, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: "0 12px 34px rgba(20,24,38,0.16)", padding: 6, zIndex: 61 }}>
            {items.map((it) => (
              <button
                key={it.label}
                onClick={() => { setPos(null); it.onClick(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  padding: "10px 12px", borderRadius: 8, border: "none", background: "none", cursor: "pointer",
                  fontSize: 13.5, fontWeight: 600, color: it.tone === "danger" ? T.danger : T.text,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F6FA")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                {it.icon && <it.icon size={17} />} {it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
