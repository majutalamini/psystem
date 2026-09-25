import { useState } from "react";
import { Modal, PrimaryButton } from "../../../components/ui";
import { HOURS } from "../../../data/agenda";
import { useAppData } from "../../../hooks/useAppData";
import { inputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";

export default function NewAppointmentModal({ onClose, onSave, defaultHour }) {
  const { patients } = useAppData();
  const [form, setForm] = useState({ paciente: patients[0].name, hora: defaultHour || "09:00", tipo: "Consulta presencial", status: "Pendente" });
  return (
    <Modal title="Novo agendamento" onClose={onClose} width={380}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Paciente</label>
      <select value={form.paciente} onChange={(e) => setForm({ ...form, paciente: e.target.value })} style={inputStyle}>
        {patients.map((p) => <option key={p.id}>{p.name}</option>)}
      </select>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Horário</label>
      <select value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} style={inputStyle}>
        {HOURS.map((h) => <option key={h}>{h}</option>)}
      </select>

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
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={() => onSave(form)}>Agendar</PrimaryButton>
      </div>
    </Modal>
  );
}
