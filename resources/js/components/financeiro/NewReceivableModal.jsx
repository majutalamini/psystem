import { useId, useState } from "react";
import { useAppData } from "../../hooks/useAppData";
import { inputStyle } from "../../styles/formStyles";
import { T } from "../../styles/theme";
import { todayLabel } from "../../utils/date";
import { matriculasAtivas } from "../../utils/matricula";
import { ErrorText, Modal, MoneyInput, PrimaryButton, PatientSelect } from "../ui";
import DateInput from "../ui/DateInput";

/* Lançamento manual. Nasce em aberto; a baixa é feita pelo botão Receber. */
export default function NewReceivableModal({ onClose, onSave, patientId }) {
  const { patient: profilePatient, errors = {} } = useAppData();
  const id = useId();
  const [form, setForm] = useState(() => {
    const patient = profilePatient?.id === patientId ? profilePatient : null;
    return {
      patientId: patientId ?? "",
      referencia: "Sessão avulsa",
      valor: patient && matriculasAtivas(patient)[0] ? matriculasAtivas(patient)[0].valor : "",
      vencimento: todayLabel(),
    };
  });
  const errorStyle = (key) => (errors[key] ? { ...inputStyle, borderColor: T.danger, marginBottom: 4 } : inputStyle);

  return (
    <Modal title="Nova conta a receber" onClose={onClose} width={380}>
      <PatientSelect value={form.patientId} onChange={id => setForm(current => ({ ...current, patientId: id }))} label="Paciente (pagante)" error={errors.patientId} />

      <label htmlFor={`${id}-referencia`} style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Referência</label>
      <input id={`${id}-referencia`} value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} style={errorStyle("referencia")} />
      <ErrorText>{errors.referencia}</ErrorText>

      <label htmlFor={`${id}-valor`} style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Valor (R$)</label>
      <MoneyInput id={`${id}-valor`} value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} style={errorStyle("valor")} />
      <ErrorText>{errors.valor}</ErrorText>

      <label htmlFor={`${id}-vencimento`} style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Vencimento</label>
      <DateInput id={`${id}-vencimento`} value={form.vencimento} onChange={(v) => setForm({ ...form, vencimento: v })} style={errorStyle("vencimento")} />
      <ErrorText>{errors.vencimento}</ErrorText>

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={() => onSave(form)} disabled={!form.patientId}>Adicionar</PrimaryButton>
      </div>
    </Modal>
  );
}
