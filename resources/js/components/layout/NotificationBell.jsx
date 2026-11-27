import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { AlertTriangle, Bell, CalendarClock, CheckCheck, Wallet, X } from "lucide-react";
import { useAppData } from "../../hooks/useAppData";
import { FONT_DISPLAY, T } from "../../styles/theme";

const VISTAS = "psystem:notificacoes-vistas";

const NIVEL = {
  perigo: { cor: T.danger, fundo: T.dangerTint },
  alerta: { cor: T.warnText, fundo: T.warnTint },
  info: { cor: T.primary, fundo: T.primaryTint },
};

const CATEGORIAS = [
  { key: "financeiro", label: "Financeiro", icon: Wallet },
  { key: "agenda", label: "Agenda", icon: CalendarClock },
];

function lerVistas() {
  try { return new Set(JSON.parse(sessionStorage.getItem(VISTAS) || "[]")); } catch { return new Set(); }
}

function salvarVistas(chaves) {
  try { sessionStorage.setItem(VISTAS, JSON.stringify([...chaves])); } catch { /* sem sessionStorage: a caixinha só reaparece */ }
}

/* Sino do cabeçalho. Sempre que surge notificação ainda não vista nesta sessão, a caixinha abre sozinha embaixo do sino. */
export default function NotificationBell({ buttonStyle }) {
  const { notifications = [], markNotificationsRead } = useAppData();
  const [aberto, setAberto] = useState(false);
  const [caixinha, setCaixinha] = useState(false);
  const ref = useRef(null);

  const chaves = useMemo(() => notifications.map((n) => n.chave), [notifications]);
  const urgentes = notifications.filter((n) => n.nivel === "perigo").length;

  // Notificação nova (não vista nesta sessão do navegador) → mostra a caixinha.
  useEffect(() => {
    const vistas = lerVistas();
    if (chaves.some((c) => !vistas.has(c))) setCaixinha(true);
    if (chaves.length === 0) setCaixinha(false);
  }, [chaves]);

  useEffect(() => {
    const fechar = (e) => { if (ref.current && !ref.current.contains(e.target)) setAberto(false); };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  function marcarVistas() {
    salvarVistas(new Set([...lerVistas(), ...chaves]));
    setCaixinha(false);
  }

  function abrirPainel() {
    marcarVistas();
    setAberto((v) => !v);
  }

  function ir(n) {
    marcarVistas();
    setAberto(false);
    router.visit(n.link);
  }

  const dispensar = (lista) => markNotificationsRead(lista);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button style={buttonStyle} title="Notificações" onClick={abrirPainel} aria-label={`Notificações (${notifications.length})`}>
        <Bell size={20} />
        {notifications.length > 0 && (
          <span style={{
            position: "absolute", top: -3, right: -3, minWidth: 19, height: 19, padding: "0 5px", boxSizing: "border-box",
            borderRadius: 999, background: urgentes ? T.danger : T.warn, color: "#fff", fontSize: 11, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff",
          }}>
            {notifications.length > 99 ? "99+" : notifications.length}
          </span>
        )}
      </button>

      {/* Caixinha que aparece sozinha quando há notificação nova */}
      {caixinha && !aberto && notifications.length > 0 && (
        <div style={{ ...popover, width: 320, padding: 14 }}>
          <Seta />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: urgentes ? T.dangerTint : T.warnTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AlertTriangle size={18} color={urgentes ? T.danger : T.warnText} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>
                Você tem {notifications.length} {notifications.length === 1 ? "notificação" : "notificações"}
              </div>
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>
                {notifications.slice(0, 2).map((n) => n.titulo).join(" · ")}{notifications.length > 2 ? "…" : ""}
              </div>
              <button onClick={() => { marcarVistas(); setAberto(true); }} style={{ marginTop: 8, padding: 0, border: "none", background: "none", color: T.primary, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Ver notificações
              </button>
            </div>
            <button onClick={marcarVistas} title="Fechar" style={{ border: "none", background: "none", color: T.muted, cursor: "pointer", padding: 0 }}><X size={16} /></button>
          </div>
        </div>
      )}

      {aberto && (
        <div style={{ ...popover, width: 400 }}>
          <Seta />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: T.text }}>Notificações</span>
            {notifications.length > 0 && (
              <button onClick={() => dispensar(chaves)} style={{ display: "flex", alignItems: "center", gap: 5, border: "none", background: "none", color: T.primary, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
                <CheckCheck size={15} /> Marcar todas como lidas
              </button>
            )}
          </div>

          <div style={{ maxHeight: 440, overflowY: "auto" }}>
            {notifications.length === 0 && (
              <div style={{ padding: "34px 16px", textAlign: "center", color: T.muted, fontSize: 13.5 }}>
                <Bell size={28} style={{ opacity: 0.4 }} />
                <div style={{ marginTop: 8 }}>Nenhuma notificação por aqui.</div>
              </div>
            )}

            {CATEGORIAS.map((cat) => {
              const itens = notifications.filter((n) => n.categoria === cat.key);
              if (!itens.length) return null;
              return (
                <div key={cat.key}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px 6px", fontSize: 11.5, fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    <cat.icon size={14} /> {cat.label} ({itens.length})
                  </div>
                  {itens.map((n) => {
                    const estilo = NIVEL[n.nivel] || NIVEL.info;
                    return (
                      <div
                        key={n.chave}
                        onClick={() => ir(n)}
                        style={{ display: "flex", gap: 10, padding: "10px 16px", cursor: "pointer", borderLeft: `3px solid ${estilo.cor}` }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: estilo.cor }}>{n.titulo}</span>
                          </div>
                          <div style={{ fontSize: 13, color: T.text, marginTop: 2, lineHeight: 1.4 }}>{n.texto}</div>
                        </div>
                        <button
                          title="Dispensar"
                          onClick={(e) => { e.stopPropagation(); dispensar([n.chave]); }}
                          style={{ alignSelf: "flex-start", border: "none", background: "none", color: T.muted, cursor: "pointer", padding: 2 }}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const popover = {
  position: "absolute", top: "calc(100% + 12px)", right: -8, zIndex: 60,
  background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: 14,
  boxShadow: "0 16px 40px rgba(20,24,38,0.22)",
};

function Seta() {
  return (
    <span style={{
      position: "absolute", top: -7, right: 20, width: 12, height: 12, transform: "rotate(45deg)",
      background: T.surface, borderLeft: `1px solid ${T.border}`, borderTop: `1px solid ${T.border}`,
    }} />
  );
}
