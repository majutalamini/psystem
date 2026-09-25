import { useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { blankRecordForm } from "../../../components/prontuario/blankRecordForm";
import RecordCard from "../../../components/prontuario/RecordCard";
import RecordForm from "../../../components/prontuario/RecordForm";
import { Card, PrimaryButton } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { T } from "../../../styles/theme";

export default function ProntuarioTab({ patient }) {
  const { records, saveRecord } = useAppData();
  const list = records[patient.id] || [];
  const [editingId, setEditingId] = useState(null); // null | "new" | entry id

  function handleSave(form) {
    const id = editingId === "new" ? Date.now() : editingId;
    saveRecord(patient.id, { ...form, id });
    setEditingId(null);
  }

  if (editingId !== null) {
    const editingEntry = editingId === "new" ? blankRecordForm() : list.find((r) => r.id === editingId);
    return <RecordForm initial={editingEntry} onCancel={() => setEditingId(null)} onSave={handleSave} />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
          {list.length} {list.length === 1 ? "registro no prontuário" : "registros no prontuário"}
        </div>
        <PrimaryButton icon={Plus} style={{ padding: "12px 18px", fontSize: 14.5 }} onClick={() => setEditingId("new")}>Novo registro</PrimaryButton>
      </div>

      {list.length === 0 ? (
        <Card style={{ padding: 34, textAlign: "center" }}>
          <ClipboardList size={34} color={T.muted} style={{ opacity: 0.5 }} />
          <div style={{ fontSize: 15.5, color: T.muted, marginTop: 10 }}>Nenhum registro no prontuário ainda para este paciente.</div>
        </Card>
      ) : (
        list.map((entry) => (
          <RecordCard key={entry.id} entry={entry} onEdit={() => setEditingId(entry.id)} />
        ))
      )}
    </div>
  );
}
