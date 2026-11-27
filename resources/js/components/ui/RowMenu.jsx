import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import { T } from "../../styles/theme";

const MENU_WIDTH = 230;
const GAP = 6;
const MARGIN = 12;

/* Menu de ações de linha (⋮) — posicionado em `fixed` para não ser
   cortado por tabelas com overflow hidden. Abre para cima quando não
   há espaço abaixo do botão (linhas no fim da tela). */
export default function RowMenu({ items }) {
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);

  function close() { setOpen(false); setPos(null); }

  // Mede o menu já renderizado e decide se cabe abaixo ou acima do botão.
  useLayoutEffect(() => {
    if (!open || !btnRef.current || !menuRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const h = menuRef.current.offsetHeight;
    const vh = window.innerHeight;
    const spaceBelow = vh - r.bottom - GAP - MARGIN;
    const spaceAbove = r.top - GAP - MARGIN;
    const top = h <= spaceBelow || spaceBelow >= spaceAbove
      ? r.bottom + GAP
      : Math.max(MARGIN, r.top - GAP - h);
    const left = Math.min(Math.max(MARGIN, r.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - MARGIN);
    setPos({ top, left });
  }, [open]);

  // Fecha ao rolar ou redimensionar, para o menu não ficar solto longe do botão.
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => (open ? close() : setOpen(true))}
        style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex" }}
        title="Mais ações"
      >
        <MoreVertical size={19} />
      </button>
      {open && (
        <>
          <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
          <div
            ref={menuRef}
            style={{
              position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, width: MENU_WIDTH,
              maxHeight: `calc(100vh - ${MARGIN * 2}px)`, overflowY: "auto",
              visibility: pos ? "visible" : "hidden",
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
              boxShadow: "0 12px 34px rgba(20,24,38,0.16)", padding: 6, zIndex: 61,
            }}
          >
            {items.map((it) => (
              <button
                key={it.label}
                onClick={() => { close(); it.onClick(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  padding: "10px 12px", borderRadius: 8, border: "none", background: "none", cursor: "pointer",
                  fontSize: 13.5, fontWeight: 600, color: it.tone === "danger" ? T.danger : T.text,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)}
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
