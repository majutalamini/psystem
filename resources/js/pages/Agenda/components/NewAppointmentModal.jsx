import { useId, useState } from "react";
import { ErrorText, Modal, MoneyInput, PrimaryButton, PatientSelect, TimeInput, normalizeTime, isTimeAllowed } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { inputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import { isPastSlot } from "../../../utils/date";

/* Só aparecem horários que ainda aceitam consulta: sem os lotados pelo limite de Configurações (occupied)
   e sem os que já passaram. Paciente repetido no mesmo horário é recusado pelo servidor. */
export default function NewAppointmentModal({ date, dateLabel, defaultHour, occupied = [], onClose }) {
  const id = useId();
  const { hours, addAppointment, errors = {} } = useAppData();
  const livres = hours.filter((h) => !occupied.includes(h) && !isPastSlot(date, h));
  const [form, setForm] = useState({
    patientId: "",
    hora: livres.includes(defaultHour) ? defaultHour : livres[0] || "",
    tipo: "Consulta presencial",
    status: "Pendente",
    valor: "",
  });

  function handleSave() {
    if (isTimeAllowed(form.hora, livres)) addAppointment({ ...form, hora: normalizeTime(form.hora), date }, { onSuccess: onClose });
  }

  return (
    <Modal title="Novo agendamento" onClose={onClose} width={380}>
      <div style={{ fontSize: 13, color: T.muted, marginBottom: 14, textTransform: "capitalize" }}>{dateLabel}</div>

      <PatientSelect value={form.patientId} onChange={id => setForm(current => ({ ...current, patientId: id }))} error={errors.patientId} />

      <TimeInput label="Horário" value={form.hora} required options={livres} onChange={hora => setForm(current => ({ ...current, hora }))}
        error={errors.hora || (normalizeTime(form.hora) && !livres.includes(normalizeTime(form.hora)) ? "Este horário não está mais disponível. Escolha outro horário." : undefined)} />
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

      <label htmlFor={`${id}-valor`} style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Valor da consulta</label>
      <MoneyInput id={`${id}-valor`}
        value={form.valor} onChange={(v) => setForm({ ...form, valor: v })}
        style={errors.valor ? { ...inputStyle, borderColor: T.danger, marginBottom: 4 } : inputStyle}
      />
      <ErrorText>{errors.valor}</ErrorText>
      <div style={{ fontSize: 12.5, color: T.muted, marginTop: -6, marginBottom: 12 }}>
        Fica em aberto no financeiro do paciente, uma única vez (não se repete). Use 0 se não houver cobrança.
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={handleSave} disabled={!isTimeAllowed(form.hora, livres) || !form.patientId || form.valor === ""}>Agendar</PrimaryButton>
      </div>
    </Modal>
  );
}
