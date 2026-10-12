import { WEEKDAY_LABELS } from "../../../data/agenda";
import { EVENT_STYLES, T } from "../../../styles/theme";
import { addDaysIso, isPastSlot, parseIsoDate } from "../../../utils/date";

/* Grade da semana: horários nas linhas e os 7 dias nas colunas. */
export default function AgendaSemana({ weekStart, today, events, hours, query, onOpenEvent, onNewAt, onOpenDay }) {
  const dias = WEEKDAY_LABELS.map((label, i) => ({ label, iso: addDaysIso(weekStart, i) }));
  const rows = [...new Set([...hours, ...events.map((e) => e.time)])].sort();
  const q = query.trim().toLowerCase();
  const cols = "64px repeat(7, minmax(0, 1fr))";

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflowX: "auto" }}>
      <div style={{ minWidth: 820 }}>
        <div style={{ display: "grid", gridTemplateColumns: cols, borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt }}>
          <div />
          {dias.map((d) => {
            const isToday = d.iso === today;
            return (
              <button
                key={d.iso}
                onClick={() => onOpenDay(d.iso)}
                title="Ver o dia"
                style={{ padding: "12px 4px", border: "none", background: "none", cursor: "pointer", borderLeft: `1px solid ${T.border}`, textAlign: "center" }}
              >
                <div style={{ fontSize: 11.5, fontWeight: 700, color: isToday ? T.primary : T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>{d.label}</div>
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, marginTop: 3, borderRadius: "50%",
                  fontSize: 16, fontWeight: 800, background: isToday ? T.primary : "transparent", color: isToday ? "#fff" : T.text,
                }}>
                  {parseIsoDate(d.iso).getDate()}
                </div>
              </button>
            );
          })}
        </div>

        {rows.length === 0 && (
          <div style={{ padding: 20, fontSize: 13.5, color: T.muted }}>Nenhum horário de expediente configurado. Ajuste em Configurações › Horário.</div>
        )}
        {rows.map((h, i) => (
          <div key={h} style={{ display: "grid", gridTemplateColumns: cols, minHeight: 62, borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ padding: "10px 0 0 14px", fontSize: 12.5, fontWeight: 600, color: T.muted }}>{h}</div>
            {dias.map((d) => {
              const ev = events.find((e) => e.isoDate === d.iso && e.time === h);
              const passado = isPastSlot(d.iso, h);
              const style = ev ? EVENT_STYLES[ev.color] : null;
              const match = !q || (ev && ev.name.toLowerCase().includes(q));
              return (
                <div key={d.iso} style={{ borderLeft: `1px solid ${T.border}`, padding: 4 }}>
                  {ev ? (
                    <button
                      onClick={() => onOpenEvent(ev)}
                      title={`${ev.name} · ${ev.status}`}
                      style={{
                        width: "100%", height: "100%", minHeight: 52, textAlign: "left", cursor: "pointer", border: "none", borderRadius: 9, padding: "7px 9px",
                        background: style.bg, borderLeft: `4px solid ${style.text}`, opacity: match ? 1 : 0.35,
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: style.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.name}</div>
                      <div style={{ fontSize: 11.5, color: style.text, opacity: 0.85, marginTop: 2 }}>{ev.status}</div>
                    </button>
                  ) : !passado ? (
                    <button
                      onClick={() => onNewAt(d.iso, h)}
                      title="Agendar neste horário"
                      style={{ width: "100%", height: "100%", minHeight: 52, border: "1px dashed transparent", borderRadius: 9, background: "none", color: "transparent", cursor: "pointer", fontSize: 18 }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = "transparent"; }}
                    >
                      +
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
