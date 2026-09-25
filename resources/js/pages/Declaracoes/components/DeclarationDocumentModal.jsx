import { useState } from "react";
import { Copy, Printer } from "lucide-react";
import { Modal, PrimaryButton } from "../../../components/ui";
import { T } from "../../../styles/theme";
import { todayLabel } from "../../../utils/date";

export default function DeclarationDocumentModal({ template, patient, values, onClose, onPrint }) {
  const paragraphs = template.build(patient, values, todayLabel());
  const [copied, setCopied] = useState(false);

  function copyText() {
    const text = paragraphs.join("\n\n");
    try {
      navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {}
  }

  return (
    <Modal title="Documento gerado" onClose={onClose} width={560}>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "28px 26px", background: "#FDFDFE" }}>
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15, marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{template.title.toUpperCase()}</div>
        <div style={{ height: 2, width: 46, background: T.primary, margin: "6px auto 20px", borderRadius: 2 }} />
        {paragraphs.map((p, i) => (
          <p key={i} style={{ fontSize: 13.5, lineHeight: 1.8, color: T.text, marginBottom: 14, textAlign: "justify" }}>{p}</p>
        ))}
        <p style={{ fontSize: 13.5, color: T.text, marginTop: 26 }}>Criciúma, {todayLabel()}.</p>
        <div style={{ marginTop: 34, textAlign: "center" }}>
          <div style={{ borderTop: `1px solid ${T.text}`, width: 240, margin: "0 auto 6px" }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Dra. Isadora Talamini</div>
          <div style={{ fontSize: 12, color: T.muted }}>Psicóloga · CRP 12/34567</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={copyText} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13.5 }}>
          <Copy size={18} /> {copied ? "Copiado!" : "Copiar texto"}
        </button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Printer} onClick={() => onPrint(template, paragraphs)}>
          Imprimir / Baixar PDF
        </PrimaryButton>
      </div>
    </Modal>
  );
}
