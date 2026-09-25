import { useEffect, useState } from "react";
import { Phone, Send } from "lucide-react";
import { WA_TEMPLATES } from "../../data/whatsapp";
import { useAppData } from "../../hooks/useAppData";
import { inputStyle } from "../../styles/formStyles";
import { T, WA_GREEN } from "../../styles/theme";
import { fillWaVars, openWhatsapp } from "../../utils/whatsapp";
import { Avatar, Modal } from "../ui";

export default function WhatsappQuickModal({ onClose, initialPatientId = null, initialTemplate = "lembrete" }) {
  const { patients, receivables, whatsapp } = useAppData();
  const [patientId, setPatientId] = useState(initialPatientId ?? (patients[0] ? patients[0].id : null));
  const [templateKey, setTemplateKey] = useState(initialTemplate);
  const [text, setText] = useState("");

  const patient = patients.find((p) => p.id === patientId) || null;
  const pendente = patient
    ? receivables.find((r) => r.paciente === patient.name && r.status !== "Pago")
    : null;

  useEffect(() => {
    const tpl = WA_TEMPLATES.find((t) => t.key === templateKey);
    setText(patient && tpl && tpl.field ? fillWaVars(whatsapp[tpl.field], patient, pendente) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, templateKey, whatsapp]);

  function handleSend() {
    if (!text.trim()) return;
    openWhatsapp(patient ? patient.phone : "", text);
    onClose();
  }

  return (
    <Modal title="Enviar mensagem no WhatsApp" onClose={onClose} width={520}>
      <label style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>Paciente</label>
      <select value={patientId ?? ""} onChange={(e) => setPatientId(Number(e.target.value))} style={inputStyle}>
        {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {patient && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F1FCF5", border: "1px solid #CFEEDC", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
          <Avatar initials={patient.initials} color={patient.color} src={patient.photo} size={42} />
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: T.text }}>{patient.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.muted }}>
              <Phone size={15} /> {patient.phone}
            </div>
          </div>
        </div>
      )}

      <label style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>Modelo de mensagem</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0 16px" }}>
        {WA_TEMPLATES.map((t) => {
          const active = t.key === templateKey;
          return (
            <button
              key={t.key}
              onClick={() => setTemplateKey(t.key)}
              style={{
                padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 600,
                border: `1px solid ${active ? T.primary : T.border}`,
                background: active ? T.primaryTint : "#fff",
                color: active ? T.primaryDark : T.text,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <label style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>Mensagem</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="Escreva a mensagem que será aberta no WhatsApp..."
        style={{ ...inputStyle, minHeight: 130, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
      />
      <div style={{ fontSize: 12.5, color: T.muted, marginTop: -6, marginBottom: 16 }}>
        A conversa abre no WhatsApp Web (ou no aplicativo) já com o texto pronto para envio.
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancelar</button>
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "11px 0", borderRadius: 10, border: "none", cursor: text.trim() ? "pointer" : "default",
            background: text.trim() ? WA_GREEN : "#BFE8CD", color: "#fff", fontWeight: 700, fontSize: 14,
          }}
        >
          <Send size={18} /> Abrir no WhatsApp
        </button>
      </div>
    </Modal>
  );
}
