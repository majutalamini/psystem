import { useRef } from "react";
import { Check, Send } from "lucide-react";
import { T } from "../../../styles/theme";
import { fillWaSample } from "../../../utils/whatsapp";
import SettingsSection from "./SettingsSection";
import { settingsInputStyle, settingsLabelStyle } from "./settingsStyles";

export default function MessageTemplateField({ icon, tone, title, description, value, onChange, variables, onTest }) {
  const areaRef = useRef(null);

  /* Insere a variável na posição do cursor, sem perder o que já foi escrito. */
  function insertVariable(v) {
    const el = areaRef.current;
    if (!el) { onChange(`${value}${v}`); return; }
    const start = el.selectionStart == null ? value.length : el.selectionStart;
    const end = el.selectionEnd == null ? value.length : el.selectionEnd;
    onChange(value.slice(0, start) + v + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + v.length, start + v.length);
    });
  }

  return (
    <SettingsSection
      icon={icon}
      tone={tone}
      title={title}
      description={description}
      action={
        <button
          onClick={onTest}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 15px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", color: T.text, fontSize: 13.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          <Send size={17} /> Testar envio
        </button>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 22 }}>
        <div>
          <label style={settingsLabelStyle}>Texto da mensagem</label>
          <textarea
            ref={areaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={5}
            style={{ ...settingsInputStyle, minHeight: 132, resize: "vertical", fontFamily: "inherit", lineHeight: 1.65 }}
          />
          <div style={{ fontSize: 12.5, color: T.muted, margin: "12px 0 8px" }}>
            Clique em uma variável para inseri-la no texto:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {variables.map((v) => (
              <button
                key={v}
                onClick={() => insertVariable(v)}
                style={{
                  padding: "7px 13px", borderRadius: 999, border: `1px dashed ${T.primary}`,
                  background: T.primaryTint, color: T.primaryDark, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "monospace",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={settingsLabelStyle}>Pré-visualização</label>
          <div style={{ background: "#E9E2DA", borderRadius: 14, padding: 18, minHeight: 132, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{
              background: "#DCF8C6", borderRadius: "16px 16px 4px 16px", padding: "13px 15px",
              marginLeft: "auto", maxWidth: "94%", fontSize: 14.5, lineHeight: 1.6, color: "#101B14",
              boxShadow: "0 1px 2px rgba(0,0,0,0.12)", whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {fillWaSample(value) || "Escreva a mensagem ao lado para ver a pré-visualização."}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, fontSize: 11, color: "#5C8F66", marginTop: 6 }}>
                09:41 <Check size={13} />
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: T.muted, marginTop: 10 }}>
            Exemplo com dados fictícios — no envio real as variáveis são preenchidas com os dados do paciente.
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
