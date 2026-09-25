import { useRef, useState } from "react";
import { Eye, FileText, Paperclip, Trash2 } from "lucide-react";
import { Card, FormField, PrimaryButton } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { iconBtn, inputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import { todayLabel } from "../../../utils/date";
import { formatFileSize } from "../../../utils/format";

export default function DocumentosTab({ patient }) {
  const { documents, addDocument, removeDocument } = useAppData();
  const list = documents[patient.id] || [];
  const [title, setTitle] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const fileRef = useRef(null);

  function handleAdd() {
    if (!pendingFile || !title.trim()) return;
    addDocument(patient.id, {
      id: Date.now(),
      title: title.trim(),
      fileName: pendingFile.name,
      size: pendingFile.size,
      url: URL.createObjectURL(pendingFile),
      date: todayLabel(),
    });
    setTitle("");
    setPendingFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <Card style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 14 }}>
          Adicionar documento
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <FormField label="Título do documento" value={title} onChange={setTitle} placeholder="Ex: Laudo médico" />
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Arquivo</label>
            <input
              ref={fileRef}
              type="file"
              onChange={(e) => setPendingFile(e.target.files[0] || null)}
              style={{ ...inputStyle, padding: "7px 12px" }}
            />
          </div>
        </div>
        <PrimaryButton icon={Paperclip} onClick={handleAdd} style={{ marginTop: 4 }}>
          Salvar documento
        </PrimaryButton>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
          {list.length} {list.length === 1 ? "documento anexado" : "documentos anexados"}
        </div>
        {list.length === 0 ? (
          <div style={{ fontSize: 13.5, color: T.muted, padding: 20 }}>Nenhum documento anexado ainda para este paciente.</div>
        ) : (
          list.map((d, i) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText size={20} color={T.primary} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                <div style={{ fontSize: 12, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.fileName} · {formatFileSize(d.size)} · Anexado em {d.date}
                </div>
              </div>
              <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ ...iconBtn, textDecoration: "none" }} title="Abrir documento"><Eye size={20} /></a>
              <button onClick={() => removeDocument(patient.id, d.id)} style={{ ...iconBtn, background: "#fff" }} title="Remover documento"><Trash2 size={20} /></button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
