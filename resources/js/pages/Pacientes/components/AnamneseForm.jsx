import { useState } from "react";
import { Check } from "lucide-react";
import { Card, FormField, PrimaryButton } from "../../../components/ui";
import { ANAMNESE_SECTIONS } from "../../../data/anamnese";
import { T } from "../../../styles/theme";

export default function AnamneseForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  return (
    <Card style={{ padding: 24, marginBottom: 16 }}>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 18 }}>
        Preencha a anamnese do paciente. Você pode registrar quantas anamneses forem necessárias e editar qualquer uma delas depois.
      </div>
      {ANAMNESE_SECTIONS.map((section) => (
        <div key={section.title} style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>
            {section.title}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            {section.fields.map((f) => (
              <div key={f.key} style={{ gridColumn: f.textarea ? "1 / -1" : undefined }}>
                <FormField label={f.label} value={form[f.key]} onChange={(v) => setForm({ ...form, [f.key]: v })} textarea={f.textarea} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, marginTop: 8, position: "sticky", bottom: 0, background: T.surface, paddingTop: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Check} onClick={() => onSave(form)}>Salvar anamnese</PrimaryButton>
      </div>
    </Card>
  );
}
