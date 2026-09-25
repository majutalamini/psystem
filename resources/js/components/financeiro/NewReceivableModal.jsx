import { useState } from "react";
import { useAppData } from "../../hooks/useAppData";
import { inputStyle } from "../../styles/formStyles";
import { T } from "../../styles/theme";
import { Modal, PrimaryButton } from "../ui";

export default function NewReceivableModal({ onClose, onSave, defaultPatientName }) {
  const { patients } = useAppData();
  const [form, setForm] = useState({ paciente: defaultPatientName || patients[0].name, referencia: "Mensalidade — Agosto/2026", valor: 800, vencimento: "20/08/2026", status: "Pendente" });
  return (
    <Modal title="Nova conta a receber" onClose={onClose} width={380}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Paciente (pagante)</label>
      <select value={form.paciente} onChange={(e) => setForm({ ...form, paciente: e.target.value })} style={inputStyle}>
        {patients.map((p) => <option key={p.id}>{p.name}</option>)}
      </select>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Referência</label>
      <input value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} style={inputStyle} />

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Valor (R$)</label>
      <input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} style={inputStyle} />

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Vencimento</label>
      <input value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} placeholder="dd/mm/aaaa" style={inputStyle} />

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Status</label>
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
        <option>Pago</option>
        <option>Pendente</option>
        <option>Atrasado</option>
      </select>

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={() => onSave({ ...form, valor: Number(form.valor) })}>Adicionar</PrimaryButton>
      </div>
    </Modal>
  );
}
