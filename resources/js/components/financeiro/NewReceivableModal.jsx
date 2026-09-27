import { useState } from "react";
import { useAppData } from "../../hooks/useAppData";
import { inputStyle } from "../../styles/formStyles";
import { T } from "../../styles/theme";
import { todayLabel } from "../../utils/date";
import { ErrorText, Modal, PrimaryButton } from "../ui";

/* Lançamento manual. Nasce em aberto; a baixa é feita pelo botão Receber. */
export default function NewReceivableModal({ onClose, onSave, patientId }) {
  const { patients, errors = {} } = useAppData();
  const [form, setForm] = useState(() => {
    const patient = patients.find((p) => p.id === patientId);
    return {
      patientId: patientId ?? (patients[0] ? patients[0].id : ""),
      referencia: "Sessão avulsa",
      valor: patient && patient.matricula ? patient.matricula.valor : "",
      vencimento: todayLabel(),
    };
  });
  const errorStyle = (key) => (errors[key] ? { ...inputStyle, borderColor: T.danger, marginBottom: 4 } : inputStyle);

  return (
    <Modal title="Nova conta a receber" onClose={onClose} width={380}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Paciente (pagante)</label>
      <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: Number(e.target.value) })} style={errorStyle("patientId")}>
        {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <ErrorText>{errors.patientId}</ErrorText>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Referência</label>
      <input value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} style={errorStyle("referencia")} />
      <ErrorText>{errors.referencia}</ErrorText>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Valor (R$)</label>
      <input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} style={errorStyle("valor")} />
      <ErrorText>{errors.valor}</ErrorText>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Vencimento</label>
      <input value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} placeholder="dd/mm/aaaa" style={errorStyle("vencimento")} />
      <ErrorText>{errors.vencimento}</ErrorText>

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={() => onSave(form)}>Adicionar</PrimaryButton>
      </div>
    </Modal>
  );
}
