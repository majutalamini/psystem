import { WEEKDAY_LABELS } from "../../../data/agenda";
import { EVENT_STYLES, T } from "../../../styles/theme";
import { addDaysIso, parseIsoDate } from "../../../utils/date";

/* Dias que aparecem no calendário do mês (de segunda a domingo, completando as semanas). */
export function diasDoMes(mesIso) {
  const primeiro = parseIsoDate(mesIso);
  const ultimo = new Date(primeiro.getFullYear(), primeiro.getMonth() + 1, 0);
  const offsetInicio = (primeiro.getDay() + 6) % 7; // segunda = 0
  const inicio = addDaysIso(mesIso, -offsetInicio);
  const total = Math.ceil((offsetInicio + ultimo.getDate()) / 7) * 7;
  return Array.from({ length: total }, (_, i) => addDaysIso(inicio, i));
}

/* Calendário do mês: cada dia mostra a quantidade de consultas e as primeiras; clicar abre o dia. */
export default function AgendaMes({ dias, mesIso, today, events, query, onOpenDay }) {
  const mes = parseIsoDate(mesIso).getMonth();
  const q = query.trim().toLowerCase();

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
        {WEEKDAY_LABELS.map((l) => (
          <div key={l} style={{ padding: "11px 0", textAlign: "center", fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>{l}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {dias.map((iso, i) => {
          const d = parseIsoDate(iso);
          const doMes = d.getMonth() === mes;
          const isToday = iso === today;
          const evs = events.filter((e) => e.isoDate === iso).sort((a, b) => a.time.localeCompare(b.time));
          const fundo = doMes ? "transparent" : T.surfaceAlt;
          return (
            <button
              key={iso}
              onClick={() => onOpenDay(iso)}
              style={{
                minHeight: 108, padding: 8, textAlign: "left", cursor: "pointer", border: "none", display: "flex", flexDirection: "column", gap: 4,
                borderTop: i >= 7 ? `1px solid ${T.border}` : "none", borderLeft: i % 7 ? `1px solid ${T.border}` : "none",
                background: fundo, opacity: doMes ? 1 : 0.55,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = fundo)}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%",
                  fontSize: 14, fontWeight: 700, background: isToday ? T.primary : "transparent", color: isToday ? "#fff" : T.text,
                }}>{d.getDate()}</span>
                {evs.length > 0 && (
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: T.primaryDark, background: T.primaryTint, borderRadius: 999, padding: "2px 8px" }}>{evs.length}</span>
                )}
              </div>
              {evs.slice(0, 3).map((ev) => {
                const st = EVENT_STYLES[ev.color];
                const match = !q || ev.name.toLowerCase().includes(q);
                return (
                  <div key={ev.id} style={{ width: "100%", fontSize: 11.5, fontWeight: 600, color: st.text, background: st.bg, borderRadius: 6, padding: "2px 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: match ? 1 : 0.35 }}>
                    {ev.time} {ev.name}
                  </div>
                );
              })}
              {evs.length > 3 && <div style={{ fontSize: 11.5, color: T.muted, fontWeight: 600 }}>+{evs.length - 3} mais</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
