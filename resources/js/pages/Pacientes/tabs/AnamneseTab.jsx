import { useState } from "react";
import { Edit3, Plus } from "lucide-react";
import { Card, PrimaryButton } from "../../../components/ui";
import { ANAMNESE_FIELDS, ANAMNESE_SECTIONS } from "../../../data/anamnese";
import { useAppData } from "../../../hooks/useAppData";
import { iconBtn } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import { todayLabel } from "../../../utils/date";
import AnamneseForm from "../components/AnamneseForm";

export default function AnamneseTab({ patient }) {
  const { anamneses, saveAnamnese } = useAppData();
  const list = anamneses[patient.id] || [];
  const [editingId, setEditingId] = useState(null); // null | "new" | entry id

  function blankForm() {
    return Object.fromEntries(ANAMNESE_FIELDS.map((f) => [f.key, ""]));
  }

  function handleSave(form) {
    const id = editingId === "new" ? Date.now() : editingId;
    const preenchidoEm = editingId === "new" ? todayLabel() : form.preenchidoEm;
    saveAnamnese(patient.id, { ...form, id, preenchidoEm });
    setEditingId(null);
  }

  if (editingId !== null) {
    const editingEntry = editingId === "new" ? blankForm() : list.find((a) => a.id === editingId);
    return <AnamneseForm initial={editingEntry} onCancel={() => setEditingId(null)} onSave={handleSave} />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
          {list.length} {list.length === 1 ? "anamnese registrada" : "anamneses registradas"}
        </div>
        <PrimaryButton icon={Plus} onClick={() => setEditingId("new")}>Nova anamnese</PrimaryButton>
      </div>

      {list.length === 0 ? (
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 13.5, color: T.muted }}>Nenhuma anamnese registrada ainda para este paciente.</div>
        </Card>
      ) : (
        list.map((entry) => {
          const filledSections = ANAMNESE_SECTIONS
            .map((section) => ({ ...section, fields: section.fields.filter((f) => entry[f.key]) }))
            .filter((section) => section.fields.length > 0);
          return (
            <Card key={entry.id} style={{ padding: 24, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: T.muted }}>Preenchida em {entry.preenchidoEm}</div>
                <button onClick={() => setEditingId(entry.id)} style={{ ...iconBtn, background: "#fff" }} title="Editar anamnese"><Edit3 size={20} /></button>
              </div>
              {filledSections.length === 0 ? (
                <div style={{ fontSize: 13.5, color: T.muted }}>Nenhuma pergunta respondida ainda.</div>
              ) : (
                filledSections.map((section) => (
                  <div key={section.title} style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>
                      {section.title}
                    </div>
                    {section.fields.map((f) => (
                      <div key={f.key} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>{f.label}</div>
                        <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.6 }}>{entry[f.key]}</div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
