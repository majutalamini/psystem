import { useState } from "react";
import { router } from "@inertiajs/react";
import {
  AlertOctagon, ArrowLeft, ArrowRight, CalendarClock, Check, Edit3, FileSignature, MapPin, Plus, RefreshCw, Trash2, Video, X,
} from "lucide-react";
import { Card, DateInput, ErrorText, Modal, MoneyInput, Pill, PrimaryButton } from "../../../components/ui";
import { WEEKDAY_FULL } from "../../../data/agenda";
import { useAppData } from "../../../hooks/useAppData";
import { inputStyle } from "../../../styles/formStyles";
import { FONT_DISPLAY, T } from "../../../styles/theme";
import { confirmar } from "../../../utils/alertas";
import { addDaysBr } from "../../../utils/contrato";
import { formatMoney } from "../../../utils/format";
import { matriculasAtivas } from "../../../utils/matricula";

const labelStyle = { fontSize: 13.5, fontWeight: 600, color: T.muted };
const ghostBtn = {
  display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, border: `1px solid ${T.border}`,
  background: T.surface, color: T.text, fontWeight: 600, cursor: "pointer", fontSize: 13.5,
};
const PACOTES = [4, 8, 12, 16];
const STATUS_TOM = { ativo: "success", bloqueado: "danger", encerrado: "muted" };

/* Horários livres no dia: sem os das matrículas ativas de outros pacientes nem os já usados por este. */
function useHorariosLivres(patient) {
  const { patients, hours } = useAppData();
  return (dia, ignorar = []) => {
    const ocupados = new Set(ignorar);
    patients.filter((p) => p.id !== patient.id).forEach((p) => {
      matriculasAtivas(p).filter((m) => m.weekday === dia).forEach((m) => ocupados.add(m.time));
    });
    return hours.filter((h) => !ocupados.has(h));
  };
}

export default function ContratosTab({ patient, contracts }) {
  const { endContract } = useAppData();
  const [criando, setCriando] = useState(false);
  const aberto = contracts.find((c) => c.status === "ativo" || c.status === "bloqueado");
  const historico = contracts.filter((c) => c !== aberto);

  async function encerrar(c) {
    const ok = await confirmar({
      titulo: "Encerrar este contrato?",
      texto: "O pacote deixa de renovar, as próximas sessões ainda não confirmadas saem da agenda e as mensalidades futuras sem pagamento são canceladas. O paciente ficará inativo. O histórico de sessões e cobranças continua.",
      confirmar: "Encerrar contrato",
      perigo: true,
    });
    if (ok) endContract(c.id);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: T.text }}>Contratos</div>
          <div style={{ fontSize: 13.5, color: T.muted, marginTop: 2, maxWidth: 620 }}>
            O contrato é o pacote de sessões do paciente. Ao fim de cada pacote ele renova sozinho e lança a próxima mensalidade,
            até ser encerrado. Com contrato ativo o paciente fica ativo; com título vencido o contrato é bloqueado.
          </div>
        </div>
        {!aberto && <PrimaryButton icon={Plus} onClick={() => setCriando(true)}>Novo contrato</PrimaryButton>}
      </div>

      {!aberto && (
        <Card style={{ padding: 32, textAlign: "center", marginBottom: 16 }}>
          <FileSignature size={36} color={T.muted} style={{ opacity: 0.5 }} />
          <div style={{ fontSize: 15.5, fontWeight: 700, color: T.text, marginTop: 10 }}>Sem contrato em vigor</div>
          <div style={{ fontSize: 13.5, color: T.muted, marginTop: 4, marginBottom: 16 }}>
            O paciente está inativo. Crie um contrato com o pacote de sessões e os dias e horários da matrícula.
          </div>
          <PrimaryButton icon={Plus} style={{ margin: "0 auto" }} onClick={() => setCriando(true)}>Criar contrato</PrimaryButton>
        </Card>
      )}

      {aberto && <ContratoAberto contrato={aberto} patient={patient} onEncerrar={() => encerrar(aberto)} />}

      {historico.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>Contratos encerrados</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {historico.map((c) => (
              <Card key={c.id} style={{ padding: "14px 18px", opacity: 0.8, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <FileSignature size={20} color={T.muted} />
                <div style={{ flex: 1, minWidth: 200, fontSize: 14, color: T.text }}>
                  <strong>{c.sessoes} sessões</strong> · R$ {formatMoney(c.valor)} por pacote · {c.ciclo} {c.ciclo === 1 ? "pacote" : "pacotes"}
                  <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>De {c.inicio} até {c.encerradoEm || "—"}</div>
                </div>
                <Pill tone="muted">Encerrado</Pill>
              </Card>
            ))}
          </div>
        </div>
      )}

      {criando && <NovoContratoModal patient={patient} onClose={() => setCriando(false)} />}
    </div>
  );
}

function ContratoAberto({ contrato: c, patient, onEncerrar }) {
  const { updateContract, addMatricula, updateMatricula, deleteMatricula, errors = {} } = useAppData();
  const livresNo = useHorariosLivres(patient);
  const [editando, setEditando] = useState(false);
  const [sessoes, setSessoes] = useState(c.sessoes);
  const [valor, setValor] = useState(c.valor);
  const [horarioEmEdicao, setHorarioEmEdicao] = useState(null); // null | "novo" | id da matrícula

  const bloqueado = c.status === "bloqueado";
  const ativas = c.matriculas.filter((m) => m.status === "ativa");
  const feitas = Math.min(c.feitasNoCiclo ?? 0, c.sessoes);
  const pct = c.sessoes ? Math.round((feitas / c.sessoes) * 100) : 0;

  const usadosNoDia = (dia, ignorarId) => ativas.filter((m) => m.weekday === dia && m.id !== ignorarId).map((m) => m.time);

  function salvarContrato() {
    updateContract(c.id, { sessoes, valor: valor === "" ? 0 : valor }, { onSuccess: () => setEditando(false) });
  }

  function salvarHorario(m, form) {
    const opts = { onSuccess: () => setHorarioEmEdicao(null) };
    if (m) updateMatricula(m.id, form, opts);
    else addMatricula(c.id, form, opts);
  }

  async function removerHorario(m) {
    const ok = await confirmar({
      titulo: "Tirar este horário do contrato?",
      texto: `As próximas sessões de ${WEEKDAY_FULL[m.weekday].toLowerCase()} às ${m.time} ainda não confirmadas saem da agenda. O fim do pacote atual é recalculado.`,
      confirmar: "Remover horário",
      perigo: true,
    });
    if (ok) deleteMatricula(m.id);
  }

  return (
    <Card style={{ padding: 0, overflow: "hidden", border: `1.5px solid ${bloqueado ? T.danger : T.primary}` }}>
      {bloqueado && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 20px", background: T.dangerTint, color: T.danger }}>
          <AlertOctagon size={22} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5 }}>
            <strong>Contrato bloqueado por inadimplência.</strong> As sessões futuras saíram da agenda e o pacote não renova.
            Ao quitar os títulos vencidos, o contrato é desbloqueado automaticamente e a agenda é refeita.
          </div>
          <button onClick={() => router.visit(`/pacientes/${patient.id}?aba=financeiro`)} style={{ ...ghostBtn, borderColor: T.danger, color: T.danger, background: T.surface }}>
            Ver financeiro
          </button>
        </div>
      )}

      <div style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: bloqueado ? T.dangerTint : T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileSignature size={24} color={bloqueado ? T.danger : T.primary} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 19, color: T.text }}>Pacote de {c.sessoes} sessões</span>
              <Pill tone={STATUS_TOM[c.status]}>{c.statusLabel}</Pill>
            </div>
            <div style={{ fontSize: 13.5, color: T.muted, marginTop: 4 }}>
              R$ {formatMoney(c.valor)} por pacote · contrato desde {c.inicio}
            </div>
          </div>
          {!editando && (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setSessoes(c.sessoes); setValor(c.valor); setEditando(true); }} style={ghostBtn}><Edit3 size={16} /> Editar pacote</button>
              <button onClick={onEncerrar} style={{ ...ghostBtn, color: T.danger }}><Trash2 size={16} /> Encerrar contrato</button>
            </div>
          )}
        </div>

        {editando && (
          <div style={{ marginTop: 18, padding: 16, borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0 16px" }}>
              <div>
                <label style={labelStyle}>Sessões por pacote</label>
                <input type="number" min={1} max={100} value={sessoes} onChange={(e) => setSessoes(e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} />
                <ErrorText>{errors.sessoes}</ErrorText>
              </div>
              <div>
                <label style={labelStyle}>Valor do pacote (R$)</label>
                <MoneyInput value={valor} onChange={setValor} style={inputStyle} />
                <ErrorText>{errors.valor}</ErrorText>
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 12 }}>
              Vale para o pacote atual (o fim é recalculado e a mensalidade em aberto, se ainda sem pagamento, é ajustada) e para as próximas renovações.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setEditando(false)} style={ghostBtn}><X size={16} /> Cancelar</button>
              <PrimaryButton icon={Check} onClick={salvarContrato} disabled={!sessoes}>Salvar pacote</PrimaryButton>
            </div>
          </div>
        )}

        {/* Pacote atual */}
        <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: T.surfaceAlt }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: T.text }}>
              Pacote atual: nº {c.ciclo}
              <span style={{ fontWeight: 500, color: T.muted }}> · {c.cicloInicio} até {c.cicloFim || "—"}</span>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>{feitas} de {c.sessoes} sessões</div>
          </div>
          <div style={{ height: 9, borderRadius: 999, background: T.track, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: bloqueado ? T.danger : T.primary, borderRadius: 999, transition: "width .3s" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.muted, marginTop: 10 }}>
            <RefreshCw size={14} />
            {bloqueado
              ? "Renovação suspensa enquanto o contrato estiver bloqueado."
              : c.cicloFim
                ? `Renova automaticamente em ${addDaysBr(c.cicloFim, 1)}, lançando a mensalidade do próximo pacote.`
                : "Defina ao menos um dia e horário para calcular o fim do pacote."}
          </div>
        </div>

        {/* Matrícula: dias e horários fixos */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 10 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: T.text }}>Dias e horários da matrícula</div>
          {horarioEmEdicao !== "novo" && (
            <button onClick={() => setHorarioEmEdicao("novo")} style={ghostBtn}><Plus size={16} /> Adicionar horário</button>
          )}
        </div>
        <ErrorText>{errors.matricula}</ErrorText>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ativas.map((m) => (horarioEmEdicao === m.id ? (
            <HorarioForm
              key={m.id} matricula={m} errors={errors}
              livresNo={(dia) => livresNo(dia, usadosNoDia(dia, m.id))}
              onCancel={() => setHorarioEmEdicao(null)} onSave={(form) => salvarHorario(m, form)}
            />
          ) : (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12, border: `1px solid ${T.border}`, flexWrap: "wrap" }}>
              <CalendarClock size={20} color={T.primary} />
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: T.text }}>Toda {WEEKDAY_FULL[m.weekday]}, às {m.time}</div>
                <div style={{ fontSize: 12.5, color: T.muted, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  {m.tipo === "Consulta online" ? <Video size={13} /> : <MapPin size={13} />} {m.tipo}
                </div>
              </div>
              <button onClick={() => setHorarioEmEdicao(m.id)} style={ghostBtn}><Edit3 size={15} /> Editar</button>
              {ativas.length > 1 && (
                <button onClick={() => removerHorario(m)} style={{ ...ghostBtn, color: T.danger }} title="Remover horário"><Trash2 size={15} /></button>
              )}
            </div>
          )))}

          {horarioEmEdicao === "novo" && (
            <HorarioForm
              matricula={null} errors={errors}
              livresNo={(dia) => livresNo(dia, usadosNoDia(dia, null))}
              onCancel={() => setHorarioEmEdicao(null)} onSave={(form) => salvarHorario(null, form)}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

function HorarioForm({ matricula: m, errors, livresNo, onCancel, onSave }) {
  const [weekday, setWeekday] = useState(m ? m.weekday : 0);
  const [time, setTime] = useState(() => (m ? m.time : livresNo(0)[0] || ""));
  const [tipo, setTipo] = useState(m ? m.tipo : "Consulta presencial");

  const livres = livresNo(weekday);
  const horarios = m && weekday === m.weekday && time === m.time && !livres.includes(time) ? [time, ...livres] : livres;

  function trocarDia(dia) {
    setWeekday(dia);
    const doDia = livresNo(dia);
    if (!doDia.includes(time) && !(m && dia === m.weekday && time === m.time)) setTime(doDia[0] || "");
  }

  return (
    <div style={{ padding: 16, borderRadius: 12, border: `1px solid ${T.primary}`, background: T.surface }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0 14px" }}>
        <div>
          <label style={labelStyle}>Dia da semana</label>
          <select value={weekday} onChange={(e) => trocarDia(Number(e.target.value))} style={inputStyle}>
            {WEEKDAY_FULL.map((l, i) => <option key={i} value={i}>{l}</option>)}
          </select>
          <ErrorText>{errors.weekday}</ErrorText>
        </div>
        <div>
          <label style={labelStyle}>Horário</label>
          <select value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle}>
            {horarios.map((h) => <option key={h}>{h}</option>)}
          </select>
          {horarios.length === 0 && <div style={{ fontSize: 12.5, color: T.danger, marginTop: -8, marginBottom: 12 }}>Nenhum horário livre neste dia.</div>}
          <ErrorText>{errors.time}</ErrorText>
        </div>
        <div>
          <label style={labelStyle}>Tipo de consulta</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
            <option>Consulta presencial</option>
            <option>Consulta online</option>
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onCancel} style={ghostBtn}><X size={16} /> Cancelar</button>
        <PrimaryButton icon={Check} onClick={() => onSave({ weekday, time, tipo })} disabled={!time}>Salvar horário</PrimaryButton>
      </div>
    </div>
  );
}

/* Criação em duas etapas: 1) pacote e início; 2) dias e horários (obrigatório) — ao finalizar já gera a matrícula,
   a agenda e a mensalidade do primeiro pacote. */
function NovoContratoModal({ patient, onClose }) {
  const { addContract, errors = {} } = useAppData();
  const livresNo = useHorariosLivres(patient);
  const hoje = new Date().toLocaleDateString("pt-BR");

  const [etapa, setEtapa] = useState(1);
  const [sessoes, setSessoes] = useState(8);
  const [valor, setValor] = useState("");
  const [inicio, setInicio] = useState(hoje);
  const [horarios, setHorarios] = useState(() => [{ weekday: 0, time: livresNo(0)[0] || "", tipo: "Consulta presencial" }]);
  const [enviando, setEnviando] = useState(false);

  const usadosNaLista = (dia, idx) => horarios.filter((h, i) => i !== idx && h.weekday === dia).map((h) => h.time);
  const livresPara = (dia, idx) => livresNo(dia, usadosNaLista(dia, idx));

  const etapa1Ok = Number(sessoes) >= 1 && /^\d{2}\/\d{2}\/\d{4}$/.test(inicio) && valor !== "";
  const etapa2Ok = horarios.length > 0 && horarios.every((h) => h.time);

  // Erros do servidor na etapa 1 levam de volta para ela.
  const errosEtapa1 = errors.sessoes || errors.valor || errors.inicio;

  function atualizar(idx, campo, v) {
    setHorarios((lista) => lista.map((h, i) => {
      if (i !== idx) return h;
      const novo = { ...h, [campo]: v };
      if (campo === "weekday") {
        const livres = livresPara(v, idx);
        if (!livres.includes(novo.time)) novo.time = livres[0] || "";
      }
      return novo;
    }));
  }

  function adicionar() {
    const dia = [0, 1, 2, 3, 4, 5, 6].find((d) => livresPara(d, -1).length > 0) ?? 0;
    setHorarios((lista) => [...lista, { weekday: dia, time: livresNo(dia, lista.filter((h) => h.weekday === dia).map((h) => h.time))[0] || "", tipo: "Consulta presencial" }]);
  }

  function finalizar() {
    setEnviando(true);
    addContract(patient.id, { sessoes, valor, inicio, horarios }, {
      onSuccess: () => onClose(),
      onError: (e) => { if (e.sessoes || e.valor || e.inicio) setEtapa(1); },
      onFinish: () => setEnviando(false),
    });
  }

  const porSemana = horarios.length || 1;
  const semanas = Math.ceil(Number(sessoes || 0) / porSemana);

  return (
    <Modal title="Novo contrato" onClose={onClose} width={640}>
      {/* Indicador de etapas */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {["Pacote de sessões", "Dias e horários"].map((rotulo, i) => {
          const n = i + 1;
          const atual = etapa === n;
          const feito = etapa > n;
          return (
            <div key={rotulo} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, background: atual ? T.primaryTint : T.surfaceAlt, border: `1px solid ${atual ? T.primary : T.border}` }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: atual || feito ? T.primary : T.track, color: "#fff", fontSize: 12.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {feito ? <Check size={14} /> : n}
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: atual ? T.primaryDark : T.muted }}>{rotulo}</span>
            </div>
          );
        })}
      </div>

      {etapa === 1 && (
        <div>
          <label style={labelStyle}>Quantidade de sessões do pacote *</label>
          <div style={{ display: "flex", gap: 8, margin: "7px 0 8px", flexWrap: "wrap" }}>
            {PACOTES.map((n) => (
              <button
                key={n}
                onClick={() => setSessoes(n)}
                style={{ padding: "9px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, border: `1.5px solid ${Number(sessoes) === n ? T.primary : T.border}`, background: Number(sessoes) === n ? T.primaryTint : T.surface, color: Number(sessoes) === n ? T.primaryDark : T.text }}
              >
                {n} sessões
              </button>
            ))}
            <input
              type="number" min={1} max={100} value={sessoes} aria-label="Outra quantidade"
              onChange={(e) => setSessoes(e.target.value === "" ? "" : Number(e.target.value))}
              style={{ ...inputStyle, width: 110, margin: 0 }}
            />
          </div>
          <ErrorText>{errors.sessoes}</ErrorText>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", marginTop: 10 }}>
            <div>
              <label style={labelStyle}>Valor do pacote (R$) *</label>
              <MoneyInput value={valor} onChange={setValor} placeholder="Ex: R$ 800,00" style={errors.valor ? { ...inputStyle, borderColor: T.danger } : inputStyle} />
              <ErrorText>{errors.valor}</ErrorText>
            </div>
            <div>
              <label style={labelStyle}>Início do pacote *</label>
              <DateInput value={inicio} onChange={setInicio} style={errors.inicio ? { ...inputStyle, borderColor: T.danger } : inputStyle} />
              <ErrorText>{errors.inicio}</ErrorText>
            </div>
          </div>

          <div style={{ fontSize: 12.5, color: T.muted, background: T.surfaceAlt, borderRadius: 10, padding: "10px 12px", marginBottom: 16 }}>
            A mensalidade do pacote vence no dia de início. Quando as {sessoes || "—"} sessões terminarem, o contrato renova sozinho e lança a próxima mensalidade.
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ ...ghostBtn, flex: 1, justifyContent: "center" }}>Cancelar</button>
            <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={() => setEtapa(2)} disabled={!etapa1Ok}>
              Continuar <ArrowRight size={17} />
            </PrimaryButton>
          </div>
        </div>
      )}

      {etapa === 2 && (
        <div>
          <div style={{ fontSize: 13.5, color: T.muted, marginBottom: 14 }}>
            Informe os dias e horários fixos da matrícula (obrigatório). As sessões entram na agenda toda semana a partir de {inicio}.
          </div>
          {errors.horarios && <ErrorText>{errors.horarios}</ErrorText>}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {horarios.map((h, i) => {
              const livres = livresPara(h.weekday, i);
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1.3fr auto", gap: 10, alignItems: "start", padding: 12, borderRadius: 12, border: `1px solid ${T.border}` }}>
                  <div>
                    <label style={labelStyle}>Dia</label>
                    <select value={h.weekday} onChange={(e) => atualizar(i, "weekday", Number(e.target.value))} style={{ ...inputStyle, marginBottom: 4 }}>
                      {WEEKDAY_FULL.map((l, d) => <option key={d} value={d}>{l}</option>)}
                    </select>
                    <ErrorText>{errors[`horarios.${i}.weekday`]}</ErrorText>
                  </div>
                  <div>
                    <label style={labelStyle}>Horário</label>
                    <select value={h.time} onChange={(e) => atualizar(i, "time", e.target.value)} style={{ ...inputStyle, marginBottom: 4 }}>
                      {livres.length === 0 && <option value="">Sem horário livre</option>}
                      {livres.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <ErrorText>{errors[`horarios.${i}.time`]}</ErrorText>
                  </div>
                  <div>
                    <label style={labelStyle}>Tipo</label>
                    <select value={h.tipo} onChange={(e) => atualizar(i, "tipo", e.target.value)} style={{ ...inputStyle, marginBottom: 4 }}>
                      <option>Consulta presencial</option>
                      <option>Consulta online</option>
                    </select>
                  </div>
                  <button
                    title="Remover"
                    disabled={horarios.length === 1}
                    onClick={() => setHorarios((lista) => lista.filter((_, j) => j !== i))}
                    style={{ marginTop: 28, border: "none", background: "none", cursor: horarios.length === 1 ? "default" : "pointer", color: horarios.length === 1 ? T.faint : T.danger }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>

          <button onClick={adicionar} style={{ ...ghostBtn, marginTop: 10 }}><Plus size={16} /> Adicionar outro dia</button>

          <div style={{ fontSize: 13, color: T.text, background: T.primaryTint, borderRadius: 10, padding: "10px 12px", margin: "16px 0" }}>
            <strong>Resumo:</strong> pacote de {sessoes} sessões, {porSemana} por semana (cerca de {semanas} {semanas === 1 ? "semana" : "semanas"}),
            R$ {valor === "" ? "0,00" : formatMoney(valor)} vencendo em {inicio}.
          </div>

          {errosEtapa1 && <div style={{ fontSize: 12.5, color: T.danger, marginBottom: 10 }}>Revise os dados do pacote na etapa 1.</div>}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setEtapa(1)} style={{ ...ghostBtn, flex: 1, justifyContent: "center" }}><ArrowLeft size={16} /> Voltar</button>
            <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Check} onClick={finalizar} disabled={!etapa2Ok || enviando}>
              Finalizar contrato
            </PrimaryButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
