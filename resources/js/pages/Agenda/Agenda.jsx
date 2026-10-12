import { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { CalendarClock, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, MapPin, MoreVertical, Plus, Video } from "lucide-react";
import { Card, PageHeader, PrimaryButton, SearchInput, StatCard } from "../../components/ui";
import { useAppData } from "../../hooks/useAppData";
import { iconBtn } from "../../styles/formStyles";
import { EVENT_STYLES, FONT_DISPLAY, T } from "../../styles/theme";
import { addDaysIso, isPastSlot, parseIsoDate, toIsoDate } from "../../utils/date";
import AgendaMes, { diasDoMes } from "./components/AgendaMes";
import AgendaSemana from "./components/AgendaSemana";
import AgendaWeekStrip from "./components/AgendaWeekStrip";
import AppointmentDetailModal from "./components/AppointmentDetailModal";
import NewAppointmentModal from "./components/NewAppointmentModal";
import { useEventosDoMes } from "./components/useEventosDoMes";

const VISOES = [
  { key: "dia", label: "Dia" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mês" },
];

const primeiroDoMes = (iso) => { const d = parseIsoDate(iso); return toIsoDate(new Date(d.getFullYear(), d.getMonth(), 1)); };
const somaMes = (iso, n) => { const d = parseIsoDate(iso); return toIsoDate(new Date(d.getFullYear(), d.getMonth() + n, 1)); };
const porExtenso = (iso) => parseIsoDate(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

/* A semana vem do servidor (consultas geradas pelas matrículas e agendamentos avulsos, sem as canceladas).
   Dia, semana e mês são formas de ver os mesmos dados; o mês busca as outras semanas por conta própria. */
export default function Agenda({ selectedDate, today, weekStart, events }) {
  const { hours } = useAppData();
  const [visao, setVisao] = useState("dia");
  const [mesIso, setMesIso] = useState(() => primeiroDoMes(selectedDate));
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState(selectedDate);
  const [defaultHour, setDefaultHour] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const diasMes = useMemo(() => diasDoMes(mesIso), [mesIso]);
  const semanasMes = useMemo(() => diasMes.filter((_, i) => i % 7 === 0), [diasMes]);
  const eventosMes = useEventosDoMes(visao === "mes", semanasMes, weekStart, events);

  const label = porExtenso(selectedDate);
  const schedule = useMemo(() => events.filter((e) => e.isoDate === selectedDate), [events, selectedDate]);
  const byTime = Object.fromEntries(schedule.map((e) => [e.time, e]));
  // Consultas fora do expediente atual (ex.: expediente alterado depois) continuam aparecendo.
  const rows = [...new Set([...hours, ...schedule.map((e) => e.time)])].sort();
  const q = query.trim().toLowerCase();

  function selectDay(iso) {
    router.get("/agenda", { data: iso }, { preserveState: true, preserveScroll: true });
  }

  function abrirDia(iso) {
    setVisao("dia");
    selectDay(iso);
  }

  function trocarVisao(v) {
    if (v === "mes") setMesIso(primeiroDoMes(selectedDate));
    setVisao(v);
  }

  function irPara(n) {
    if (visao === "dia") selectDay(addDaysIso(selectedDate, n));
    else if (visao === "semana") selectDay(addDaysIso(selectedDate, 7 * n));
    else setMesIso(somaMes(mesIso, n));
  }

  function irParaHoje() {
    if (visao === "mes") setMesIso(primeiroDoMes(today));
    else selectDay(today);
  }

  function novoAgendamento(iso, hora) {
    setModalDate(iso);
    setDefaultHour(hora || null);
    setShowModal(true);
  }

  /* Texto do período e números dos cartões de cada visão. */
  const periodo = (() => {
    if (visao === "dia") return label;
    if (visao === "semana") {
      const ini = parseIsoDate(weekStart);
      const fim = parseIsoDate(addDaysIso(weekStart, 6));
      const mesmo = ini.getMonth() === fim.getMonth();
      return `${ini.getDate()}${mesmo ? "" : ` de ${ini.toLocaleDateString("pt-BR", { month: "long" })}`} a ${fim.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}`;
    }
    return parseIsoDate(mesIso).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  })();

  const doPeriodo = useMemo(() => {
    if (visao === "dia") return schedule;
    if (visao === "semana") return events;
    return eventosMes.filter((e) => e.isoDate.slice(0, 7) === mesIso.slice(0, 7));
  }, [visao, schedule, events, eventosMes, mesIso]);

  const stats = {
    total: doPeriodo.length,
    confirmados: doPeriodo.filter((e) => e.statusKey === "confirmado").length,
    pendentes: doPeriodo.filter((e) => e.statusKey === "agendado").length,
  };
  const livres = visao === "dia"
    ? hours.filter((h) => !byTime[h] && !isPastSlot(selectedDate, h)).length
    : visao === "semana"
      ? Array.from({ length: 7 }, (_, i) => addDaysIso(weekStart, i))
        .reduce((s, d) => s + hours.filter((h) => !events.some((e) => e.isoDate === d && e.time === h) && !isPastSlot(d, h)).length, 0)
      : new Set(doPeriodo.map((e) => e.isoDate)).size;
  const escopo = { dia: "no dia", semana: "na semana", mes: "no mês" }[visao];

  return (
    <div>
      <PageHeader
        title="Agenda"
        subtitle="Acompanhe os seus agendamentos"
        action={<PrimaryButton icon={Plus} onClick={() => novoAgendamento(selectedDate)}>Novo agendamento</PrimaryButton>}
      />

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard label={`Sessões ${escopo}`} value={stats.total} icon={CalendarClock} tone="primary" />
        <StatCard label="Confirmadas" value={stats.confirmados} icon={Check} tone="success" />
        <StatCard label="A confirmar" value={stats.pendentes} icon={Clock} tone="warn" />
        <StatCard label={visao === "mes" ? "Dias com atendimento" : "Horários livres"} value={livres} icon={CalendarDays} tone="primary" />
      </div>

      {/* Barra de visão e navegação */}
      <Card style={{ padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, background: T.mutedBg, borderRadius: 12, padding: 4 }}>
          {VISOES.map((v) => {
            const on = visao === v.key;
            return (
              <button
                key={v.key}
                onClick={() => trocarVisao(v.key)}
                style={{
                  padding: "9px 20px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700,
                  background: on ? T.primary : "transparent", color: on ? "#fff" : T.muted,
                  boxShadow: on ? "0 3px 8px rgba(76,111,255,0.28)" : "none",
                }}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => irPara(-1)} style={iconBtn} title="Anterior"><ChevronLeft size={19} /></button>
          <button
            onClick={irParaHoje}
            style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
          >
            Hoje
          </button>
          <button onClick={() => irPara(1)} style={iconBtn} title="Próximo"><ChevronRight size={19} /></button>
        </div>

        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: T.text, textTransform: "capitalize" }}>{periodo}</span>

        <div style={{ marginLeft: "auto" }}>
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar paciente..." />
        </div>
      </Card>

      {q && (
        <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 10 }}>
          {doPeriodo.filter((e) => e.name.toLowerCase().includes(q)).length} resultado(s) para “{query}” {escopo}
        </div>
      )}

      {visao === "semana" && (
        <AgendaSemana
          weekStart={weekStart} today={today} events={events} hours={hours} query={query}
          onOpenEvent={setSelectedEvent} onNewAt={novoAgendamento} onOpenDay={abrirDia}
        />
      )}

      {visao === "mes" && (
        <AgendaMes dias={diasMes} mesIso={mesIso} today={today} events={eventosMes} query={query} onOpenDay={abrirDia} />
      )}

      {visao === "dia" && (
        <>
          <AgendaWeekStrip weekStart={weekStart} selectedDate={selectedDate} today={today} events={events} onSelectDay={selectDay} />
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
                <div key={h} style={{ display: "flex", alignItems: "stretch", minHeight: 64, borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ width: 84, flexShrink: 0, display: "flex", alignItems: "flex-start", paddingTop: 14, paddingLeft: 20, fontSize: 14, color: T.muted, fontWeight: 700 }}>
                    {h}
                  </div>
                  <div style={{ flex: 1, padding: "8px 20px 8px 0", display: "flex", alignItems: "center" }}>
                    {ev ? (
                      <button
                        onClick={() => setSelectedEvent(ev)}
                        style={{
                          width: "100%", background: style.bg, borderLeft: `5px solid ${style.text}`,
                          border: "none", borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
                          cursor: "pointer", textAlign: "left", opacity: matches ? (ev.statusKey === "falta" ? 0.6 : 1) : 0.35, transition: "opacity .15s",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontWeight: 700, fontSize: 15, color: style.text }}>{ev.name}</span>
                            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: "rgba(255,255,255,0.55)", color: style.text }}>
                              {ev.status}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: style.text, opacity: 0.85, display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                            {ev.type === "Consulta online" ? <Video size={15} /> : <MapPin size={15} />} {ev.type}
                            {ev.recurring && <><CalendarClock size={15} style={{ marginLeft: 6 }} /> Matrícula</>}
                          </div>
                        </div>
                        <MoreVertical size={19} color={style.text} style={{ opacity: 0.6, flexShrink: 0 }} />
                      </button>
                    ) : isPastSlot(selectedDate, h) ? (
                      <span style={{ padding: "10px 4px", fontSize: 13, color: T.faint }}>—</span>
                    ) : (
                      <button
                        onClick={() => novoAgendamento(selectedDate, h)}
                        style={{ width: "100%", padding: "12px 10px", fontSize: 13.5, color: T.faint, background: "none", border: "1px dashed transparent", borderRadius: 10, textAlign: "left", cursor: "pointer" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = T.faint; }}
                      >
                        + Horário livre — clique para agendar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        </>
      )}

      {showModal && (
        <NewAppointmentModal
          date={modalDate}
          dateLabel={porExtenso(modalDate)}
          defaultHour={defaultHour}
          occupied={events.filter((e) => e.isoDate === modalDate).map((e) => e.time)}
          onClose={() => setShowModal(false)}
        />
      )}

      {selectedEvent && (
        <AppointmentDetailModal
          event={selectedEvent}
          dateLabel={porExtenso(selectedEvent.isoDate)}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
