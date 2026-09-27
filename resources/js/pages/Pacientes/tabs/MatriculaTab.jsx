import { useState } from "react";
import { CalendarClock, CalendarX, Check, Edit3, Plus } from "lucide-react";
import { Card, ErrorText, MoneyInput, PrimaryButton } from "../../../components/ui";
import { WEEKDAY_FULL } from "../../../data/agenda";
import { useAppData } from "../../../hooks/useAppData";
import { iconBtn, inputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";

export default function MatriculaTab({ patient }) {
  const { patients, hours, saveMatricula, removeMatricula, errors = {} } = useAppData();
  const m = patient.matricula;

  // Horários livres no dia da semana: sem os que já são de matrícula de outro paciente ativo.
  const livresNo = (dia) => {
    const ocupados = new Set(patients
      .filter((p) => p.id !== patient.id && p.status === "Ativo" && p.matricula && p.matricula.weekday === dia)
      .map((p) => p.matricula.time));
    return hours.filter((h) => !ocupados.has(h));
  };

  const [editing, setEditing] = useState(!m);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [weekday, setWeekday] = useState(m ? m.weekday : 0);
  const [time, setTime] = useState(m ? m.time : livresNo(0)[0]);
  const [tipo, setTipo] = useState(m ? m.tipo : "Consulta presencial");
  const [valor, setValor] = useState(m ? m.valor : "");
  const livres = livresNo(weekday);
  // O horário atual da matrícula pode ter ficado fora do expediente; ele continua na lista.
  const horarios = m && time === m.time && weekday === m.weekday && !livres.includes(time) ? [time, ...livres] : livres;

  function selectWeekday(dia) {
    setWeekday(dia);
    const livresDia = livresNo(dia);
    if (!livresDia.includes(time) && !(m && dia === m.weekday && time === m.time)) setTime(livresDia[0]);
  }

  function handleSave() {
    saveMatricula(patient.id, { weekday, time, tipo, valor }, { onSuccess: () => setEditing(false) });
  }

  /* Excluir apaga as consultas futuras da matrícula e deixa o paciente inativo (no servidor). */
  function handleRemove() {
    removeMatricula(patient.id, {
      onSuccess: () => { setConfirmRemove(false); setEditing(false); setRemoved(true); },
    });
  }

  if (!editing && !patient.matricula) {
    return (
      <Card style={{ padding: 28, textAlign: "center" }}>
        <CalendarX size={34} color={T.muted} style={{ opacity: 0.5 }} />
        <div style={{ fontSize: 15.5, fontWeight: 700, color: T.text, marginTop: 10 }}>
          {removed ? "Matrícula excluída" : "Sem matrícula"}
        </div>
        <div style={{ fontSize: 13.5, color: T.muted, marginTop: 4, marginBottom: 16 }}>
          {removed
            ? "As próximas consultas da matrícula foram retiradas da agenda e o paciente ficou inativo."
            : "Este paciente não tem dia e horário fixos na agenda."}
        </div>
        <PrimaryButton icon={Plus} style={{ margin: "0 auto" }} onClick={() => setEditing(true)}>Criar matrícula</PrimaryButton>
      </Card>
    );
  }

  if (!editing && patient.matricula) {
    return (
      <Card style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Matrícula ativa</div>
            <div style={{ fontSize: 12.5, color: T.muted, maxWidth: 440 }}>
              Este paciente entra automaticamente na agenda toda semana nesse dia e horário, sem precisar agendar manualmente.
            </div>
          </div>
          <button onClick={() => setEditing(true)} style={{ ...iconBtn, background: "#fff" }} title="Editar matrícula"><Edit3 size={20} /></button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, background: T.primaryTint, borderRadius: 12, padding: "16px 20px" }}>
          <div style={{ width: 46, height: 46, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CalendarClock size={22} color={T.primary} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.primaryDark }}>
              Toda {WEEKDAY_FULL[patient.matricula.weekday]}, às {patient.matricula.time}
            </div>
            <div style={{ fontSize: 12.5, color: T.primaryDark, opacity: 0.8, marginTop: 2 }}>
              {patient.matricula.tipo} · R$ {patient.matricula.valor.toLocaleString("pt-BR")} por sessão
            </div>
          </div>
        </div>
        {confirmRemove ? (
          <div style={{ marginTop: 16, background: T.dangerTint, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Excluir a matrícula?</div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>
              As próximas consultas ainda não confirmadas saem da agenda e o paciente fica inativo. O histórico de sessões e cobranças continua.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button onClick={() => setConfirmRemove(false)} style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13.5 }}>
                Cancelar
              </button>
              <button onClick={handleRemove} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: T.danger, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}>
                Excluir matrícula
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmRemove(true)} style={{ marginTop: 16, background: "none", border: "none", color: T.danger, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0 }}>
            Excluir matrícula
          </button>
        )}
      </Card>
    );
  }

  return (
    <Card style={{ padding: 24 }}>
      {patient.status !== "Ativo" && (
        <div style={{ fontSize: 13, color: "#8A6413", background: T.warnTint, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
          Paciente inativo: as consultas da matrícula só entram na agenda quando ele for marcado como ativo (Mais ações › Marcar como ativo).
        </div>
      )}
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 14 }}>
        Defina um dia da semana e horário fixos para este paciente. Ele será incluído automaticamente na agenda das próximas semanas, sem precisar agendar manualmente. Cada sessão realizada gera uma cobrança com o valor abaixo.
      </div>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Dia da semana</label>
      <select value={weekday} onChange={(e) => selectWeekday(Number(e.target.value))} style={inputStyle}>
        {WEEKDAY_FULL.map((label, i) => <option key={i} value={i}>{label}</option>)}
      </select>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Horário</label>
      <select value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle}>
        {horarios.map((h) => <option key={h}>{h}</option>)}
      </select>
      {horarios.length === 0 && (
        <div style={{ fontSize: 12.5, color: T.danger, marginTop: -8, marginBottom: 12 }}>Nenhum horário livre neste dia da semana.</div>
      )}
      <ErrorText>{errors.time}</ErrorText>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Tipo de consulta</label>
      <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
        <option>Consulta presencial</option>
        <option>Consulta online</option>
      </select>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Valor da sessão (R$)</label>
      <MoneyInput
        value={valor} onChange={setValor} placeholder="Ex: 200,00"
        style={errors.valor ? { ...inputStyle, borderColor: T.danger, marginBottom: 4 } : inputStyle}
      />
      <ErrorText>{errors.valor}</ErrorText>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        {(patient.matricula || removed) && (
          <button onClick={() => setEditing(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        )}
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Check} onClick={handleSave} disabled={!time}>Salvar matrícula</PrimaryButton>
      </div>
    </Card>
  );
}
