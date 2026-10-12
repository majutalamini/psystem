import { useState } from "react";
import { Check } from "lucide-react";
import { Card, ErrorText, FormField, PrimaryButton } from "../../../components/ui";
import { ANAMNESE_FIELDS } from "../../../data/anamnese";
import { useAppData } from "../../../hooks/useAppData";
import { T } from "../../../styles/theme";

/* As perguntas vêm do banco; o rótulo diz se a resposta pede uma caixa de texto grande. */
const TEXTAREA_LABELS = new Set(ANAMNESE_FIELDS.filter((f) => f.textarea).map((f) => f.label));

/* initial = { titulo, respostas }. Cada anamnese é independente: salvar uma não altera as outras do paciente. */
export default function AnamneseForm({ secoes, initial, editando, onCancel, onSave }) {
  const { errors = {} } = useAppData();
  const [titulo, setTitulo] = useState(initial.titulo || "");
  const [respostas, setRespostas] = useState(() => ({ ...initial.respostas }));

  return (
    <Card style={{ padding: 24, marginBottom: 16 }}>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 18 }}>
        {editando
          ? "Você está editando esta anamnese. As outras anamneses do paciente não são alteradas."
          : "Esta será uma nova anamnese; as que o paciente já tem continuam como estão."}
      </div>

      <div style={{ maxWidth: 420, marginBottom: 8 }}>
        <FormField label="Título (opcional)" value={titulo} onChange={setTitulo} placeholder="Ex.: Acolhimento inicial, Reavaliação 2026" error={errors.titulo} />
      </div>

      {secoes.map((section) => (
        <div key={section.title} style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>
            {section.title}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            {section.fields.map((f) => {
              const textarea = TEXTAREA_LABELS.has(f.label);
              return (
                <div key={f.key} style={{ gridColumn: textarea ? "1 / -1" : undefined }}>
                  <FormField label={f.label} value={respostas[f.key]} onChange={(v) => setRespostas({ ...respostas, [f.key]: v })} textarea={textarea} />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <ErrorText>{errors.respostas}</ErrorText>
      <div style={{ display: "flex", gap: 10, marginTop: 8, position: "sticky", bottom: 0, background: T.surface, paddingTop: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Check} onClick={() => onSave({ titulo, respostas })}>
          {editando ? "Salvar alterações" : "Salvar anamnese"}
        </PrimaryButton>
      </div>
    </Card>
  );
}
