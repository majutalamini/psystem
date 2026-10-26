import { useState } from "react";
import { CalendarClock, CalendarX, Check, Edit3, Plus, Trash2, Video, MapPin } from "lucide-react";
import { Card, ErrorText, MoneyInput, PrimaryButton } from "../../../components/ui";
import { WEEKDAY_FULL } from "../../../data/agenda";
import { useAppData } from "../../../hooks/useAppData";
import { inputStyle } from "../../../styles/formStyles";
import { FONT_DISPLAY, T } from "../../../styles/theme";
import { confirmar } from "../../../utils/alertas";
import { matriculasAtivas, matriculasDe, suportaVariasMatriculas } from "../../../utils/matricula";

const LEGACY_KEY = "legacy";
const keyOf = (m) => (m.id != null ? m.id : LEGACY_KEY);

const labelStyle = { fontSize: 13.5, fontWeight: 600, color: T.muted };
const ghostBtn = { padding: "9px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, fontWeight: 600, cursor: "pointer", fontSize: 13.5 };

export default function MatriculaTab({ patient }) {
  const { patients, hours, saveMatricula, removeMatricula, addMatricula, updateMatricula, deleteMatricula, errors = {} } = useAppData();
  const lista = matriculasDe(patient);
  const varias = suportaVariasMatriculas(patient);

  const [editingKey, setEditingKey] = useState(null); // null | "new" | id da matrícula

  // Horários livres no dia: sem os de matrículas de outros pacientes ativos nem as outras matrículas deste paciente.
  const livresNo = (dia, ignorarKey) => {
    const ocupados = new Set();
    patients.filter((p) => p.id !== patient.id && p.status === "Ativo").forEach((p) => {
      matriculasAtivas(p).filter((m) => m.weekday === dia).forEach((m) => ocupados.add(m.time));
    });
    lista.filter((m) => keyOf(m) !== ignorarKey && m.weekday === dia).forEach((m) => ocupados.add(m.time));
    return hours.filter((h) => !ocupados.has(h));
  };

  function salvar(m, form) {
    const opts = { onSuccess: () => setEditingKey(null) };
    if (!varias) saveMatricula(patient.id, form, opts);
    else if (m) updateMatricula(m.id, form, opts);
    else addMatricula(patient.id, form, opts);
  }

  /* Encerrar apaga as consultas futuras da matrícula; sem matrícula ativa o paciente fica inativo (no servidor). */
  async function excluir(m) {
    const ultima = matriculasAtivas(patient).length <= 1;
    const ok = await confirmar({
      titulo: "Encerrar esta matrícula?",
      texto: `As próximas consultas ainda não confirmadas saem da agenda. ${ultima ? "Como é a última matrícula ativa, o paciente ficará inativo. " : ""}O histórico de sessões e cobranças continua.`,
      confirmar: "Encerrar matrícula",
      perigo: true,
    });
    if (!ok) return;
    if (!varias) removeMatricula(patient.id);
    else deleteMatricula(m.id);
  }

  const podeAdicionar = varias || lista.length === 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: T.text }}>Matrículas</div>
          <div style={{ fontSize: 13.5, color: T.muted, marginTop: 2, maxWidth: 520 }}>
            Cada matrícula é um dia e horário fixos na agenda, repetidos toda semana. O paciente pode ter mais de uma.
          </div>
        </div>
        {podeAdicionar && editingKey !== "new" && lista.length > 0 && (
          <PrimaryButton icon={Plus} onClick={() => setEditingKey("new")}>Nova matrícula</PrimaryButton>
        )}
      </div>

      {patient.status !== "Ativo" && (
        <div style={{ fontSize: 13, color: T.warnText, background: T.warnTint, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
          Paciente inativo: as consultas só entram na agenda quando ele tiver uma matrícula ativa.
        </div>
      )}

      {lista.length === 0 && editingKey !== "new" && (
        <Card style={{ padding: 32, textAlign: "center" }}>
          <CalendarX size={36} color={T.muted} style={{ opacity: 0.5 }} />
          <div style={{ fontSize: 15.5, fontWeight: 700, color: T.text, marginTop: 10 }}>Sem matrícula</div>
          <div style={{ fontSize: 13.5, color: T.muted, marginTop: 4, marginBottom: 16 }}>Este paciente não tem dia e horário fixos na agenda.</div>
          <PrimaryButton icon={Plus} style={{ margin: "0 auto" }} onClick={() => setEditingKey("new")}>Criar matrícula</PrimaryButton>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {lista.map((m) => {
          const k = keyOf(m);
          if (editingKey === k) {
            return (
              <MatriculaForm
                key={k} matricula={m} patient={patient} errors={errors}
                livresNo={(dia) => livresNo(dia, k)} onCancel={() => setEditingKey(null)} onSave={(form) => salvar(m, form)}
              />
            );
          }
          const encerrada = m.status === "encerrada";
          return (
            <Card key={k} style={{ padding: 20, opacity: encerrada ? 0.65 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CalendarClock size={22} color={T.primary} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 16.5, color: T.text }}>
                    Toda {WEEKDAY_FULL[m.weekday]}, às {m.time}
                    {encerrada && <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 700, color: T.muted, background: T.mutedBg, borderRadius: 999, padding: "3px 10px" }}>Encerrada</span>}
                  </div>
                  <div style={{ fontSize: 13.5, color: T.muted, marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {m.tipo === "Consulta online" ? <Video size={15} /> : <MapPin size={15} />} {m.tipo}
                    <span>· R$ {Number(m.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} por sessão</span>
                  </div>
                </div>
                {!encerrada && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setEditingKey(k)} style={{ ...ghostBtn, display: "flex", alignItems: "center", gap: 6 }}><Edit3 size={16} /> Editar</button>
                    <button onClick={() => excluir(m)} style={{ ...ghostBtn, display: "flex", alignItems: "center", gap: 6, color: T.danger }}><Trash2 size={16} /> Encerrar</button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {editingKey === "new" && (
          <MatriculaForm
            matricula={null} patient={patient} errors={errors}
            livresNo={(dia) => livresNo(dia, null)} onCancel={() => setEditingKey(null)} onSave={(form) => salvar(null, form)}
          />
        )}
      </div>
    </div>
  );
}

function MatriculaForm({ matricula: m, patient, errors, livresNo, onCancel, onSave }) {
  const [weekday, setWeekday] = useState(m ? m.weekday : 0);
  const [time, setTime] = useState(m ? m.time : livresNo(0)[0]);
  const [tipo, setTipo] = useState(m ? m.tipo : "Consulta presencial");
  const [valor, setValor] = useState(m ? m.valor : "");

  const livres = livresNo(weekday);
  // O horário atual pode ter ficado fora do expediente; ele continua na lista.
  const horarios = m && time === m.time && weekday === m.weekday && !livres.includes(time) ? [time, ...livres] : livres;

  function selectWeekday(dia) {
    setWeekday(dia);
    const livresDia = livresNo(dia);
    if (!livresDia.includes(time) && !(m && dia === m.weekday && time === m.time)) setTime(livresDia[0]);
  }

  return (
    <Card style={{ padding: 24, border: `1px solid ${T.primary}` }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, fontWeight: 600, color: T.text, marginBottom: 4 }}>
        {m ? "Editar matrícula" : "Nova matrícula"}
      </div>
      <div style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>
        O paciente entra na agenda toda semana nesse dia e horário. Cada sessão realizada gera uma cobrança com o valor abaixo.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 16px" }}>
        <div>
          <label style={labelStyle}>Dia da semana</label>
          <select value={weekday} onChange={(e) => selectWeekday(Number(e.target.value))} style={inputStyle}>
            {WEEKDAY_FULL.map((label, i) => <option key={i} value={i}>{label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Horário</label>
          <select value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle}>
            {horarios.map((h) => <option key={h}>{h}</option>)}
          </select>
          {horarios.length === 0 && (
            <div style={{ fontSize: 12.5, color: T.danger, marginTop: -8, marginBottom: 12 }}>Nenhum horário livre neste dia da semana.</div>
          )}
          <ErrorText>{errors.time}</ErrorText>
        </div>
        <div>
          <label style={labelStyle}>Tipo de consulta</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
            <option>Consulta presencial</option>
            <option>Consulta online</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Valor da sessão (R$)</label>
          <MoneyInput
            value={valor} onChange={setValor} placeholder="Ex: 200,00"
            style={errors.valor ? { ...inputStyle, borderColor: T.danger, marginBottom: 4 } : inputStyle}
          />
          <ErrorText>{errors.valor}</ErrorText>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Check} onClick={() => onSave({ weekday, time, tipo, valor })} disabled={!time}>
          Salvar matrícula
        </PrimaryButton>
      </div>
    </Card>
  );
}
