import { useEffect, useState } from "react";
import { Check, ExternalLink, Phone, Send } from "lucide-react";
import { WA_TEMPLATES } from "../../data/whatsapp";
import { useAppData } from "../../hooks/useAppData";
import { inputStyle } from "../../styles/formStyles";
import { T, WA_GREEN } from "../../styles/theme";
import { fillWaVars, openWhatsapp } from "../../utils/whatsapp";
import { Avatar, Modal } from "../ui";

/*
 * A mensagem sai pelo número conectado ao sistema (Configurações › WhatsApp) e fica registrada em "Mensagens enviadas".
 * "Abrir no WhatsApp" continua como alternativa: abre a conversa com o texto pronto, e a psicóloga envia.
 * templates: textos ainda não salvos (teste em Configurações); sem ele, usa os textos salvos.
 */
export default function WhatsappQuickModal({ onClose, initialPatientId = null, initialTemplate = "lembrete", templates }) {
  const { patients, whatsapp: saved, whatsappModo, errors = {}, sendWhatsapp } = useAppData();
  const whatsapp = templates || saved;
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(null); // aviso depois de enviar
  const [patientId, setPatientId] = useState(initialPatientId ?? (patients[0] ? patients[0].id : null));
  const [templateKey, setTemplateKey] = useState(initialTemplate);
  const [text, setText] = useState("");

  const patient = patients.find((p) => p.id === patientId) || null;
  const pendente = patient ? patient.cobrancaPendente : null;

  useEffect(() => {
    const tpl = WA_TEMPLATES.find((t) => t.key === templateKey);
    setText(patient && tpl && tpl.field ? fillWaVars(whatsapp[tpl.field], patient, pendente) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, templateKey, whatsapp]);

  function handleSend() {
    if (!text.trim() || !patient) return;
    setEnviando(true);
    sendWhatsapp({ patientId: patient.id, tipo: templateKey, texto: text }, {
      onSuccess: (page) => setEnviado(page.props.flash.whatsapp || "Mensagem enviada."),
      onFinish: () => setEnviando(false),
    });
  }

  function handleOpen() {
    if (!text.trim()) return;
    openWhatsapp(patient ? patient.phone : "", text);
    onClose();
  }

  if (enviado) {
    return (
      <Modal title="Enviar mensagem no WhatsApp" onClose={onClose} width={420}>
        <div style={{ textAlign: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: T.successTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Check size={28} color={T.success} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{enviado}</div>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>Ela aparece em Configurações › WhatsApp › Mensagens enviadas.</div>
          <button onClick={onClose} style={{ marginTop: 18, padding: "10px 22px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Fechar</button>
        </div>
      </Modal>
    );
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
        placeholder="Escreva a mensagem..."
        style={{ ...inputStyle, minHeight: 130, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, ...(errors.texto ? { borderColor: T.danger, marginBottom: 4 } : {}) }}
      />
      {errors.texto && <div style={{ fontSize: 12.5, color: T.danger, marginBottom: 12 }}>{errors.texto}</div>}
      <div style={{ fontSize: 12.5, color: T.muted, marginTop: errors.texto ? 0 : -6, marginBottom: 16 }}>
        {whatsappModo === "teste"
          ? "Modo teste: a mensagem só fica registrada em Configurações › WhatsApp, nada é enviado."
          : "A mensagem sai pelo número conectado ao sistema."}
        {patient && !patient.aceitaWhatsapp && " Este paciente não marcou que aceita receber mensagens pelo WhatsApp."}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancelar</button>
        <button
          onClick={handleSend}
          disabled={!text.trim() || !patient || enviando}
          style={{
            flex: 1.4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "11px 0", borderRadius: 10, border: "none", cursor: text.trim() && !enviando ? "pointer" : "default",
            background: text.trim() && !enviando ? WA_GREEN : "#BFE8CD", color: "#fff", fontWeight: 700, fontSize: 14,
          }}
        >
          <Send size={18} /> {enviando ? "Enviando..." : "Enviar pelo WhatsApp"}
        </button>
      </div>
      <button
        onClick={handleOpen}
        disabled={!text.trim()}
        style={{ display: "flex", alignItems: "center", gap: 6, margin: "12px auto 0", background: "none", border: "none", color: T.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
      >
        <ExternalLink size={14} /> Ou abrir a conversa no WhatsApp e enviar por lá
      </button>
    </Modal>
  );
}
