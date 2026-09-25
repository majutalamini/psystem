import { useState } from "react";
import { Check } from "lucide-react";
import { T } from "../../styles/theme";
import { Card, FormField, PrimaryButton } from "../ui";

export default function RecordForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  return (
    <Card style={{ padding: 30, marginBottom: 18 }}>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 19, fontWeight: 700, color: T.text, marginBottom: 6 }}>
        Registro de sessão
      </div>
      <div style={{ fontSize: 14, color: T.muted, marginBottom: 22, lineHeight: 1.6 }}>
        Registre a sessão diretamente no sistema. Você pode criar quantos registros forem necessários e editar qualquer um deles depois.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Sessão" value={form.sessao} onChange={(v) => setForm({ ...form, sessao: v })} placeholder="Ex: Sessão 12" />
        <FormField label="Data" value={form.date} onChange={(v) => setForm({ ...form, date: v })} placeholder="dd/mm/aaaa" />
      </div>
      <FormField label="Técnicas utilizadas" value={form.tecnicas} onChange={(v) => setForm({ ...form, tecnicas: v })} placeholder="Ex: escuta ativa, reestruturação cognitiva" />
      <FormField label="Objetivo da sessão" value={form.objetivo} onChange={(v) => setForm({ ...form, objetivo: v })} placeholder="Ex: reduzir sintomas de ansiedade" />
      <FormField label="Descrição / relato de atendimento" value={form.descricao} onChange={(v) => setForm({ ...form, descricao: v })} textarea placeholder="Descreva o que foi trabalhado na sessão..." />
      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "13px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, fontSize: 14.5, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center", padding: "13px 16px", fontSize: 15 }} icon={Check} onClick={() => onSave(form)}>Salvar prontuário</PrimaryButton>
      </div>
    </Card>
  );
}
