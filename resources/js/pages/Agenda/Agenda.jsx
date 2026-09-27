import { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { CalendarClock, CalendarDays, Check, Clock, MapPin, MoreVertical, Plus, Video } from "lucide-react";
import { Card, PageHeader, PrimaryButton, SearchInput, StatCard } from "../../components/ui";
import { useAppData } from "../../hooks/useAppData";
import { EVENT_STYLES, T } from "../../styles/theme";
import { isPastSlot, parseIsoDate } from "../../utils/date";
import AgendaWeekStrip from "./components/AgendaWeekStrip";
import AppointmentDetailModal from "./components/AppointmentDetailModal";
import NewAppointmentModal from "./components/NewAppointmentModal";

/* A semana vem do servidor (consultas geradas pelas matrículas e agendamentos avulsos, sem as canceladas). */
export default function Agenda({ selectedDate, today, weekStart, events }) {
  const { hours } = useAppData();
  const [showModal, setShowModal] = useState(false);
  const [defaultHour, setDefaultHour] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const isToday = selectedDate === today;
  const label = isToday
    ? "Hoje"
    : parseIsoDate(selectedDate).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" });

  const schedule = useMemo(() => events.filter((e) => e.isoDate === selectedDate), [events, selectedDate]);
  const byTime = Object.fromEntries(schedule.map((e) => [e.time, e]));
  // Consultas fora do expediente atual (ex.: expediente alterado depois) continuam aparecendo.
  const rows = [...new Set([...hours, ...schedule.map((e) => e.time)])].sort();

  const stats = {
    total: schedule.length,
    confirmados: schedule.filter((e) => e.statusKey === "confirmado").length,
    pendentes: schedule.filter((e) => e.statusKey === "agendado").length,
    livres: hours.filter((h) => !byTime[h] && !isPastSlot(selectedDate, h)).length,
  };

  const q = query.trim().toLowerCase();

  function selectDay(iso) {
    router.get("/agenda", { data: iso }, { preserveState: true, preserveScroll: true });
  }

  return (
    <div>
      <PageHeader
        title="Agenda"
        subtitle="Acompanhe os seus agendamentos"
        action={<PrimaryButton icon={Plus} onClick={() => { setDefaultHour(null); setShowModal(true); }}>Novo agendamento</PrimaryButton>}
      />

      <AgendaWeekStrip weekStart={weekStart} selectedDate={selectedDate} today={today} events={events} onSelectDay={selectDay} />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => selectDay(today)}
          style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: isToday ? T.primaryTint : "#fff", color: isToday ? T.primaryDark : T.text, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
        >
          Hoje
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: T.text, textTransform: "capitalize" }}>{label}</span>
        <div style={{ marginLeft: "auto" }}>
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar paciente..." />
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard label="Sessões no dia" value={stats.total} icon={CalendarClock} tone="primary" />
        <StatCard label="Confirmadas" value={stats.confirmados} icon={Check} tone="success" />
        <StatCard label="A confirmar" value={stats.pendentes} icon={Clock} tone="warn" />
        <StatCard label="Horários livres" value={stats.livres} icon={CalendarDays} tone="primary" />
      </div>

      {q && (
        <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 10 }}>
          {schedule.filter((e) => e.name.toLowerCase().includes(q)).length} resultado(s) para “{query}” neste dia
        </div>
      )}

      <Card style={{ padding: "8px 0" }}>
        {rows.length === 0 && (
          <div style={{ padding: "16px 20px", fontSize: 13.5, color: T.muted }}>
            Nenhum horário de expediente configurado. Ajuste em Configurações › Horário.
          </div>
        )}
        {rows.map((h, i) => {
          const ev = byTime[h];
          const matches = !q || (ev && ev.name.toLowerCase().includes(q));
          const style = ev ? EVENT_STYLES[ev.color] : null;
          return (
            <div key={h} style={{ display: "flex", alignItems: "stretch", minHeight: 58, borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ width: 76, flexShrink: 0, display: "flex", alignItems: "flex-start", paddingTop: 12, paddingLeft: 20, fontSize: 13, color: T.muted, fontWeight: 600 }}>
                {h}
              </div>
              <div style={{ flex: 1, padding: "8px 20px 8px 0", display: "flex", alignItems: "center" }}>
                {ev ? (
                  <button
                    onClick={() => setSelectedEvent(ev)}
                    style={{
                      width: "100%", background: style.bg, borderLeft: `4px solid ${style.text}`,
                      border: "none", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
                      cursor: "pointer", textAlign: "left", opacity: matches ? (ev.statusKey === "falta" ? 0.6 : 1) : 0.35, transition: "opacity .15s",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: style.text }}>{ev.name}</span>
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
                          background: "rgba(255,255,255,0.55)", color: style.text,
                        }}>
                          {ev.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: style.text, opacity: 0.85, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                        {ev.type === "Consulta online" ? <Video size={14} /> : <MapPin size={14} />} {ev.type}
                        {ev.recurring && <><CalendarClock size={14} style={{ marginLeft: 4 }} /> Matrícula</>}
                      </div>
                    </div>
                    <MoreVertical size={19} color={style.text} style={{ opacity: 0.6, flexShrink: 0 }} />
                  </button>
                ) : isPastSlot(selectedDate, h) ? (
                  <span style={{ padding: "10px 4px", fontSize: 13, color: "#D5D9E4" }}>—</span>
                ) : (
                  <button
                    onClick={() => { setDefaultHour(h); setShowModal(true); }}
                    style={{ width: "100%", padding: "10px 4px", fontSize: 13, color: "#C7CCDC", background: "none", border: "1px dashed transparent", borderRadius: 8, textAlign: "left", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = "#C7CCDC"; }}
                  >
                    + Horário livre — clique para agendar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      {showModal && (
        <NewAppointmentModal
          date={selectedDate}
          dateLabel={label}
          defaultHour={defaultHour}
          occupied={schedule.map((e) => e.time)}
          onClose={() => setShowModal(false)}
        />
      )}

      {selectedEvent && (
        <AppointmentDetailModal
          event={selectedEvent}
          dateLabel={label}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
