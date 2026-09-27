import { useState } from "react";
import { ErrorText, Modal, PrimaryButton } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { inputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import { isPastSlot } from "../../../utils/date";

/* Só aparecem os horários livres: sem os que já têm consulta (occupied) e sem os que já passaram. */
export default function NewAppointmentModal({ date, dateLabel, defaultHour, occupied = [], onClose }) {
  const { patients, hours, addAppointment, errors = {} } = useAppData();
  const livres = hours.filter((h) => !occupied.includes(h) && !isPastSlot(date, h));
  const [form, setForm] = useState({
    patientId: patients[0] ? patients[0].id : "",
    hora: livres.includes(defaultHour) ? defaultHour : livres[0] || "",
    tipo: "Consulta presencial",
    status: "Pendente",
  });

  function handleSave() {
    addAppointment({ ...form, date }, { onSuccess: onClose });
  }

  return (
    <Modal title="Novo agendamento" onClose={onClose} width={380}>
      <div style={{ fontSize: 13, color: T.muted, marginBottom: 14, textTransform: "capitalize" }}>{dateLabel}</div>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Paciente</label>
      <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: Number(e.target.value) })} style={inputStyle}>
        {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <ErrorText>{errors.patientId}</ErrorText>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Horário</label>
      <select
        value={form.hora}
        onChange={(e) => setForm({ ...form, hora: e.target.value })}
        style={errors.hora ? { ...inputStyle, borderColor: T.danger, marginBottom: 4 } : inputStyle}
      >
        {livres.map((h) => <option key={h}>{h}</option>)}
      </select>
      <ErrorText>{errors.hora}</ErrorText>
      {livres.length === 0 && (
        <div style={{ fontSize: 12.5, color: T.danger, marginTop: -8, marginBottom: 12 }}>Não há horário livre para agendar neste dia.</div>
      )}

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Tipo de consulta</label>
      <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} style={inputStyle}>
        <option>Consulta presencial</option>
        <option>Consulta online</option>
      </select>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Status</label>
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
        <option>Pendente</option>
        <option>Confirmado</option>
      </select>

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={handleSave} disabled={!form.hora}>Agendar</PrimaryButton>
      </div>
    </Modal>
  );
}
