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

const dataBr = (iso) => parseIsoDate(iso).toLocaleDateString("pt-BR");
const ultimoDoMes = (iso) => { const d = parseIsoDate(iso); return toIsoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0)); };

/* A semana vem nas props. O mês usa uma única resposta com toda a grade visível.
   Vários pacientes podem ter consulta no mesmo horário; fullSlots traz os horários que já atingiram
   o limite de Configurações (vazio quando não há limite). O servidor sempre revalida ao gravar. */
export default function Agenda({ selectedDate, today, limite, weekStart, events, fullSlots = {}, agendaWindow }) {
  const { hours } = useAppData();
  const [visao, setVisao] = useState("dia");
  const [mesIso, setMesIso] = useState(() => primeiroDoMes(selectedDate));
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState(selectedDate);
  const [defaultHour, setDefaultHour] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const diasMes = useMemo(() => diasDoMes(mesIso), [mesIso]);
  const { events: eventosMes, loading: carregandoMes, error: erroMes, retry: repetirMes } = useEventosDoMes(visao === "mes", mesIso, events);

  const label = porExtenso(selectedDate);
  const schedule = useMemo(() => events.filter((e) => e.isoDate === selectedDate), [events, selectedDate]);
  const byTime = schedule.reduce((acc, e) => ({ ...acc, [e.time]: [...(acc[e.time] || []), e] }), {});
  const lotado = (iso, h) => (fullSlots[iso] || []).includes(h);
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

  const proximoBloqueado = visao === "dia" ? addDaysIso(selectedDate, 1) > limite
    : visao === "semana" ? addDaysIso(weekStart, 7) > limite
      : somaMes(mesIso, 1) > limite;

  function irPara(n) {
    if (n > 0 && proximoBloqueado) return;
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
  const fimDoPeriodo = visao === "dia" ? selectedDate : visao === "semana" ? addDaysIso(weekStart, 6) : ultimoDoMes(mesIso);
  const alemDaJanela = agendaWindow && fimDoPeriodo > agendaWindow.ate;
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
          <button
            onClick={() => irPara(1)}
            disabled={proximoBloqueado}
            style={{ ...iconBtn, opacity: proximoBloqueado ? 0.4 : 1, cursor: proximoBloqueado ? "not-allowed" : iconBtn.cursor }}
            title={proximoBloqueado ? "A agenda abre só para os próximos 2 meses" : "Próximo"}
          >
            <ChevronRight size={19} />
          </button>
        </div>

        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: T.text, textTransform: "capitalize" }}>{periodo}</span>

        <div style={{ marginLeft: "auto" }}>
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar paciente..." />
        </div>
      </Card>

      {agendaWindow?.atrasada && (
        <div role="alert" style={{ fontSize: 13, color: T.warnText, background: T.warnTint, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
          A geração automática das consultas das matrículas está atrasada
          {agendaWindow.geradaEm ? ` (última execução: ${new Date(agendaWindow.geradaEm).toLocaleString("pt-BR")})` : " (ainda não executou)"}.
          Confira se o agendador do sistema está rodando.
        </div>
      )}
      {alemDaJanela && (
        <div role="note" style={{ fontSize: 13, color: T.muted, background: T.mutedBg, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
          As consultas das matrículas são geradas até {dataBr(agendaWindow.ate)} ({agendaWindow.dias} dias). Depois dessa data aparecem só as consultas já marcadas:
          um horário vazio aqui não garante que ele estará livre.
        </div>
      )}

      {q && (
        <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 10 }}>
          {doPeriodo.filter((e) => e.name.toLowerCase().includes(q)).length} resultado(s) para “{query}” {escopo}
        </div>
      )}

      {visao === "semana" && (
        <AgendaSemana
          weekStart={weekStart} today={today} events={events} hours={hours} query={query} isFull={lotado}
          onOpenEvent={setSelectedEvent} onNewAt={novoAgendamento} onOpenDay={abrirDia}
        />
      )}

      {visao === "mes" && (
        <div aria-busy={carregandoMes}>
          {carregandoMes && <div role="status" style={{ color: T.muted, marginBottom: 8 }}>Carregando mês…</div>}
          {erroMes && <div role="alert" style={{ color: T.danger, marginBottom: 8 }}>{erroMes} <button onClick={repetirMes}>Tentar novamente</button></div>}
          <AgendaMes dias={diasMes} mesIso={mesIso} today={today} events={eventosMes} query={query} onOpenDay={abrirDia} />
        </div>
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
              const evs = byTime[h] || [];
              const podeAgendar = !isPastSlot(selectedDate, h) && !lotado(selectedDate, h);
              return (
                <div key={h} style={{ display: "flex", alignItems: "stretch", minHeight: 64, borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ width: 84, flexShrink: 0, display: "flex", alignItems: "flex-start", paddingTop: 14, paddingLeft: 20, fontSize: 14, color: T.muted, fontWeight: 700 }}>
                    {h}
                  </div>
                  <div style={{ flex: 1, padding: "8px 20px 8px 0", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
                    {evs.map((ev) => {
                      const matches = !q || ev.name.toLowerCase().includes(q);
                      const style = EVENT_STYLES[ev.color];
                      return (
                      <button
                        key={ev.id}
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
                      );
                    })}
                    {podeAgendar ? (
                      <button
                        onClick={() => novoAgendamento(selectedDate, h)}
                        style={{ width: "100%", padding: evs.length ? "6px 10px" : "12px 10px", fontSize: 13.5, color: T.faint, background: "none", border: "1px dashed transparent", borderRadius: 10, textAlign: "left", cursor: "pointer" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = T.faint; }}
                      >
                        {evs.length ? "+ Agendar outra consulta neste horário" : "+ Horário livre — clique para agendar"}
                      </button>
                    ) : evs.length === 0 && (
                      <span style={{ padding: "10px 4px", fontSize: 13, color: T.faint }}>—</span>
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
          occupied={fullSlots[modalDate] || []}
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
