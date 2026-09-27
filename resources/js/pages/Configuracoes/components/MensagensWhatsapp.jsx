import { useState } from "react";
import { Send } from "lucide-react";
import { Pill } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { T, WA_GREEN } from "../../../styles/theme";
import SettingsSection from "./SettingsSection";
import { settingsInputStyle, settingsLabelStyle } from "./settingsStyles";

const TONS = { simulada: "warn", enviada: "success", erro: "danger" };

/* Mensagem de teste (confere a configuração) e as últimas mensagens enviadas ou simuladas. */
export default function MensagensWhatsapp({ mensagens }) {
  const { auth, flash, errors = {}, testWhatsapp } = useAppData();
  const [telefone, setTelefone] = useState(auth.user.telefone || "");
  const [enviando, setEnviando] = useState(false);

  function enviarTeste() {
    setEnviando(true);
    testWhatsapp(telefone, { onFinish: () => setEnviando(false) });
  }

  return (
    <SettingsSection
      icon={Send}
      tone="whatsapp"
      title="Mensagens enviadas"
      description="As últimas 30 mensagens automáticas. No modo teste elas aparecem como “Simulada” e nada sai do sistema."
    >
      <label style={settingsLabelStyle}>Enviar mensagem de teste para</label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="(48) 99999-0000"
          style={{ ...settingsInputStyle, flex: 1, minWidth: 200, ...(errors.telefone ? { borderColor: T.danger } : {}) }}
        />
        <button
          onClick={enviarTeste}
          disabled={enviando || !telefone.trim()}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "0 18px", borderRadius: 10, border: "none",
            background: WA_GREEN, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: enviando || !telefone.trim() ? 0.6 : 1,
          }}
        >
          <Send size={16} /> Enviar teste
        </button>
      </div>
      {errors.telefone && <div style={{ fontSize: 12.5, color: T.danger, marginTop: 8 }}>{errors.telefone}</div>}
      {flash.whatsapp && !errors.telefone && (
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T.success, marginTop: 8 }}>{flash.whatsapp}</div>
      )}

      <div style={{ marginTop: 22, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        {mensagens.length === 0 ? (
          <div style={{ padding: 18, fontSize: 13.5, color: T.muted }}>Nenhuma mensagem enviada ainda.</div>
        ) : mensagens.map((m, i) => (
          <div key={m.id} style={{ padding: "14px 16px", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>{m.paciente || m.telefone}</span>
              <Pill tone="muted">{m.tipo}</Pill>
              <Pill tone={TONS[m.situacaoKey] || "muted"}>{m.situacao}</Pill>
              <span style={{ fontSize: 12.5, color: T.muted, marginLeft: "auto" }}>{m.quando} · {m.telefone}</span>
            </div>
            <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.6, marginTop: 6, whiteSpace: "pre-wrap" }}>{m.texto}</div>
            {m.erro && <div style={{ fontSize: 12.5, color: T.danger, marginTop: 4 }}>{m.erro}</div>}
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
