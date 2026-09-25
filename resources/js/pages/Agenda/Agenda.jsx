import { useMemo, useState } from "react";
import { CalendarClock, CalendarDays, Check, Clock, MapPin, MoreVertical, Plus, Video } from "lucide-react";
import { Card, PageHeader, PrimaryButton, SearchInput, StatCard } from "../../components/ui";
import { HOURS, weekSchedules } from "../../data/agenda";
import { useAppData } from "../../hooks/useAppData";
import { EVENT_STYLES, T } from "../../styles/theme";
import { TODAY, weekdayIndex } from "../../utils/date";
import AgendaWeekStrip from "./components/AgendaWeekStrip";
import AppointmentDetailModal from "./components/AppointmentDetailModal";
import NewAppointmentModal from "./components/NewAppointmentModal";

export default function Agenda({ onNavigate }) {
  const { patients } = useAppData();
  const [dayOffset, setDayOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [defaultHour, setDefaultHour] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null); // { time, ...ev }
  const [events, setEvents] = useState(() => {
    const clone = {};
    Object.keys(weekSchedules).forEach((k) => { clone[k] = weekSchedules[k].map((e) => ({ ...e })); });
    return clone;
  });
  const [cancelledOccurrences, setCancelledOccurrences] = useState(() => new Set());

  const baseDate = TODAY;
  const shown = new Date(baseDate);
  shown.setDate(baseDate.getDate() + dayOffset);
  const label = dayOffset === 0 ? "Hoje" : shown.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" });

  const schedule = useMemo(() => {
    const manual = events[dayOffset] || [];
    const manualTimes = new Set(manual.map((e) => e.time));
    const wd = weekdayIndex(dayOffset);
    const recurring = patients
      .filter((p) => p.matricula && p.matricula.weekday === wd)
      .filter((p) => !manualTimes.has(p.matricula.time))
      .filter((p) => !cancelledOccurrences.has(`${dayOffset}|${p.id}`))
      .map((p) => ({
        time: p.matricula.time, name: p.name, type: p.matricula.tipo, color: p.color,
        status: "Confirmado", recurring: true, patientId: p.id,
      }));
    return [...manual, ...recurring].sort((a, b) => a.time.localeCompare(b.time));
  }, [dayOffset, events, patients, cancelledOccurrences]);

  const byTime = Object.fromEntries(schedule.map((e) => [e.time, e]));

  const stats = useMemo(() => {
    const real = schedule.filter((e) => !e.isBreak);
    return {
      total: real.length,
      confirmados: real.filter((e) => e.status === "Confirmado").length,
      pendentes: real.filter((e) => e.status === "Pendente").length,
      livres: HOURS.length - schedule.length,
    };
  }, [schedule]);

  const q = query.trim().toLowerCase();

  function addEvent(dayOff, ev) {
    setEvents((prev) => {
      const list = prev[dayOff] ? [...prev[dayOff]] : [];
      list.push(ev);
      return { ...prev, [dayOff]: list };
    });
  }

  function removeEvent(dayOff, time) {
    setEvents((prev) => ({
      ...prev,
      [dayOff]: (prev[dayOff] || []).filter((e) => e.time !== time),
    }));
  }

  return (
    <div>
      <PageHeader
        title="Agenda"
        subtitle="Acompanhe os seus agendamentos"
        action={<PrimaryButton icon={Plus} onClick={() => { setDefaultHour(null); setShowModal(true); }}>Novo agendamento</PrimaryButton>}
      />

      <AgendaWeekStrip dayOffset={dayOffset} onSelectDay={setDayOffset} events={events} />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => setDayOffset(0)}
          style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: dayOffset === 0 ? T.primaryTint : "#fff", color: dayOffset === 0 ? T.primaryDark : T.text, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
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
          {schedule.filter((e) => !e.isBreak && e.name.toLowerCase().includes(q)).length} resultado(s) para “{query}” neste dia
        </div>
      )}

      <Card style={{ padding: "8px 0" }}>
        {HOURS.map((h, i) => {
          const ev = byTime[h];
          const matches = !q || (ev && !ev.isBreak && ev.name.toLowerCase().includes(q));
          return (
            <div key={h} style={{ display: "flex", alignItems: "stretch", minHeight: 58, borderBottom: i < HOURS.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ width: 76, flexShrink: 0, display: "flex", alignItems: "flex-start", paddingTop: 12, paddingLeft: 20, fontSize: 13, color: T.muted, fontWeight: 600 }}>
                {h}
              </div>
              <div style={{ flex: 1, padding: "8px 20px 8px 0", display: "flex", alignItems: "center" }}>
                {ev ? (
                  ev.isBreak ? (
                    <div style={{ width: "100%", background: EVENT_STYLES.gray.bg, color: "#fff", borderRadius: 10, padding: "12px 16px", fontWeight: 600, fontSize: 14 }}>
                      {ev.name}
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedEvent({ ...ev })}
                      style={{
                        width: "100%", background: EVENT_STYLES[ev.color].bg, borderLeft: `4px solid ${EVENT_STYLES[ev.color].text}`,
                        border: "none", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
                        cursor: "pointer", textAlign: "left", opacity: matches ? 1 : 0.35, transition: "opacity .15s",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: EVENT_STYLES[ev.color].text }}>{ev.name}</span>
                          {ev.status && (
                            <span style={{
                              fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
                              background: "rgba(255,255,255,0.55)", color: EVENT_STYLES[ev.color].text,
                            }}>
                              {ev.status}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12.5, color: EVENT_STYLES[ev.color].text, opacity: 0.85, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                          {ev.type === "Consulta online" ? <Video size={14} /> : <MapPin size={14} />} {ev.type}
                          {ev.recurring && <><CalendarClock size={14} style={{ marginLeft: 4 }} /> Matrícula</>}
                        </div>
                      </div>
                      <MoreVertical size={19} color={EVENT_STYLES[ev.color].text} style={{ opacity: 0.6, flexShrink: 0 }} />
                    </button>
                  )
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
          defaultHour={defaultHour}
          onClose={() => setShowModal(false)}
          onSave={(form) => {
            const patient = patients.find((p) => p.name === form.paciente);
            addEvent(dayOffset, { time: form.hora, name: form.paciente, type: form.tipo, status: form.status, color: patient ? patient.color : "purple" });
            setShowModal(false);
          }}
        />
      )}

      {selectedEvent && (
        <AppointmentDetailModal
          event={selectedEvent}
          dateLabel={label}
          onClose={() => setSelectedEvent(null)}
          onCancelAppointment={() => {
            if (selectedEvent.recurring) {
              setCancelledOccurrences((prev) => new Set(prev).add(`${dayOffset}|${selectedEvent.patientId}`));
            } else {
              removeEvent(dayOffset, selectedEvent.time);
            }
            setSelectedEvent(null);
          }}
          onGoProntuario={() => { setSelectedEvent(null); onNavigate("prontuarios"); }}
        />
      )}
    </div>
  );
}
