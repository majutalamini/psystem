import { useState } from "react";
import { Edit3, Plus } from "lucide-react";
import { Card, PrimaryButton } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { iconBtn } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import AnamneseForm from "../components/AnamneseForm";

/* Uma anamnese por paciente: editar sobrescreve as respostas. */
export default function AnamneseTab({ patient, anamnese }) {
  const { saveAnamnese } = useAppData();
  const { secoes, respostas, preenchidoEm } = anamnese;
  const [editing, setEditing] = useState(false);
  const preenchida = Object.keys(respostas).length > 0;

  function handleSave(form) {
    saveAnamnese(patient.id, form, { onSuccess: () => setEditing(false) });
  }

  if (editing) {
    return <AnamneseForm secoes={secoes} initial={respostas} onCancel={() => setEditing(false)} onSave={handleSave} />;
  }

  if (!preenchida) {
    return (
      <Card style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13.5, color: T.muted }}>Nenhuma anamnese registrada ainda para este paciente.</div>
          <PrimaryButton icon={Plus} onClick={() => setEditing(true)}>Preencher anamnese</PrimaryButton>
        </div>
      </Card>
    );
  }

  const filledSections = secoes
    .map((section) => ({ ...section, fields: section.fields.filter((f) => respostas[f.key]) }))
    .filter((section) => section.fields.length > 0);

  return (
    <Card style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: T.muted }}>Preenchida em {preenchidoEm}</div>
        <button onClick={() => setEditing(true)} style={{ ...iconBtn, background: "#fff" }} title="Editar anamnese"><Edit3 size={20} /></button>
      </div>
      {filledSections.map((section) => (
        <div key={section.title} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>
            {section.title}
          </div>
          {section.fields.map((f) => (
            <div key={f.key} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{respostas[f.key]}</div>
            </div>
          ))}
        </div>
      ))}
    </Card>
  );
}
