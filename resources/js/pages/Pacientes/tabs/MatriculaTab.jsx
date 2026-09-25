import { useState } from "react";
import { CalendarClock, Check, Edit3 } from "lucide-react";
import { Card, PrimaryButton } from "../../../components/ui";
import { HOURS, WEEKDAY_FULL } from "../../../data/agenda";
import { useAppData } from "../../../hooks/useAppData";
import { iconBtn, inputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";

export default function MatriculaTab({ patient }) {
  const { updatePatient } = useAppData();
  const [editing, setEditing] = useState(!patient.matricula);
  const [weekday, setWeekday] = useState(patient.matricula ? patient.matricula.weekday : 0);
  const [time, setTime] = useState(patient.matricula ? patient.matricula.time : HOURS[0]);
  const [tipo, setTipo] = useState(patient.matricula ? patient.matricula.tipo : "Consulta presencial");

  function handleSave() {
    updatePatient(patient.id, { matricula: { weekday, time, tipo } });
    setEditing(false);
  }

  function handleRemove() {
    updatePatient(patient.id, { matricula: null });
    setEditing(true);
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
            <div style={{ fontSize: 12.5, color: T.primaryDark, opacity: 0.8, marginTop: 2 }}>{patient.matricula.tipo}</div>
          </div>
        </div>
        <button onClick={handleRemove} style={{ marginTop: 16, background: "none", border: "none", color: T.danger, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0 }}>
          Remover matrícula
        </button>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 24 }}>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 14 }}>
        Defina um dia da semana e horário fixos para este paciente. Ele será incluído automaticamente na agenda toda semana, sem precisar agendar manualmente.
      </div>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Dia da semana</label>
      <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} style={inputStyle}>
        {WEEKDAY_FULL.map((label, i) => <option key={i} value={i}>{label}</option>)}
      </select>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Horário</label>
      <select value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle}>
        {HOURS.map((h) => <option key={h}>{h}</option>)}
      </select>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Tipo de consulta</label>
      <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
        <option>Consulta presencial</option>
        <option>Consulta online</option>
      </select>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        {patient.matricula && (
          <button onClick={() => setEditing(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        )}
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Check} onClick={handleSave}>Salvar matrícula</PrimaryButton>
      </div>
    </Card>
  );
}
