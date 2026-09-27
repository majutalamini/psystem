import { useState } from "react";
import { ErrorText, Modal, MoneyInput, PrimaryButton } from "../../../components/ui";
import { PAYABLE_CATEGORIES } from "../../../data/finance";
import { useAppData } from "../../../hooks/useAppData";
import { inputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import { todayLabel } from "../../../utils/date";

/* A despesa nasce em aberto; a baixa é feita pelo botão Pagar. */
export default function NewPayableModal({ onClose, onSave }) {
  const { errors = {} } = useAppData();
  const [form, setForm] = useState({ descricao: "", categoria: "Estrutura", valor: "", vencimento: todayLabel() });
  const errorStyle = (key) => (errors[key] ? { ...inputStyle, borderColor: T.danger, marginBottom: 4 } : inputStyle);

  return (
    <Modal title="Nova conta a pagar" onClose={onClose} width={380}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Descrição</label>
      <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Internet do consultório" style={errorStyle("descricao")} />
      <ErrorText>{errors.descricao}</ErrorText>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Categoria</label>
      <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} style={inputStyle}>
        {PAYABLE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </select>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Valor (R$)</label>
      <MoneyInput value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} style={errorStyle("valor")} />
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
