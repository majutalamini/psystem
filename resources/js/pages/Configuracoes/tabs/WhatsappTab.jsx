import { useState } from "react";
import { CalendarClock, CircleDollarSign, Play, RefreshCw } from "lucide-react";
import WhatsappIcon from "../../../components/icons/WhatsappIcon";
import { useAppData } from "../../../hooks/useAppData";
import { Switch } from "../../../components/ui";
import WhatsappQuickModal from "../../../components/whatsapp/WhatsappQuickModal";
import { WA_VARIABLES } from "../../../data/whatsapp";
import { T, WA_GREEN_DARK } from "../../../styles/theme";
import ConexaoWhatsapp from "../components/ConexaoWhatsapp";
import MensagensWhatsapp from "../components/MensagensWhatsapp";
import Field from "../components/Field";
import GoalField from "../components/GoalField";
import MessageTemplateField from "../components/MessageTemplateField";
import SettingsSection from "../components/SettingsSection";

/* modo: "teste" (só registra), "evolution" ou "twilio" (enviam), definido no .env; mensagens: as últimas enviadas ou simuladas. */
export default function WhatsappTab({ value: whatsapp, onChange: updateWhatsapp, errors, modo, conexao, mensagens = [] }) {
  const real = modo === "twilio" || modo === "evolution";
  const [testing, setTesting] = useState(null); // chave do modelo em teste
  const { flash, runWhatsappNow } = useAppData();
  const [rodando, setRodando] = useState(false);

  function enviarAgora() {
    setRodando(true);
    runWhatsappNow({ onFinish: () => setRodando(false) });
  }

  return (
    <>
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 10, borderRadius: 12, padding: "14px 16px", marginBottom: 20, fontSize: 13.5, lineHeight: 1.55,
        background: real ? "#F1FCF5" : T.warnTint, color: real ? T.text : "#8A6413",
      }}>
        <WhatsappIcon size={18} color={real ? WA_GREEN_DARK : "#8A6413"} />
        <div>
          {modo === "evolution" && <><strong>Envio pela Evolution API.</strong> As mensagens saem de verdade pelo número conectado abaixo.</>}
          {modo === "twilio" && <><strong>Envio pela Twilio.</strong> As mensagens automáticas saem de verdade pelo WhatsApp.</>}
          {!real && <><strong>Modo teste.</strong> Nenhuma mensagem sai do sistema: elas só ficam registradas em "Mensagens enviadas", abaixo.</>}
          {" "}Só recebem os pacientes ativos que aceitaram receber mensagens (marcado no cadastro).
        </div>
      </div>

      {modo === "evolution" && <ConexaoWhatsapp conexao={conexao} />}

      <SettingsSection
        icon={WhatsappIcon}
        tone="whatsapp"
        title="Envio automático"
        description="Ativa o disparo automático das mensagens configuradas abaixo. Com o envio desligado, você ainda pode mandar tudo manualmente pelo atalho do WhatsApp no topo."
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          background: whatsapp.enabled ? "#F1FCF5" : "#F7F8FC",
          border: `1px solid ${whatsapp.enabled ? "#CFEEDC" : T.border}`,
          borderRadius: 12, padding: "16px 18px", marginBottom: 22,
        }}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: T.text }}>Enviar cobranças e lembretes via WhatsApp</div>
            <div style={{ fontSize: 13.5, color: T.muted, marginTop: 3 }}>
              {whatsapp.enabled ? "Envio automático ativo para os pacientes que aceitaram receber mensagens." : "Envio automático desligado."}
            </div>
          </div>
          <Switch checked={whatsapp.enabled} onChange={(v) => updateWhatsapp({ enabled: v })} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0 20px" }}>
          <Field
            label="Número do WhatsApp comercial"
            value={whatsapp.numero}
            onChange={(v) => updateWhatsapp({ numero: v })}
            hint={modo === "evolution" ? "Número de contato do consultório. As mensagens saem pelo celular conectado em “Conexão do WhatsApp”." : "Número de contato do consultório."}
            error={errors.numero}
          />
          <GoalField
            label="Enviar cobrança antes do vencimento"
            value={whatsapp.diasAntes}
            onChange={(v) => updateWhatsapp({ diasAntes: v })}
            suffix="dias antes"
            error={errors.diasAntes}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", borderTop: `1px solid ${T.border}`, paddingTop: 18, marginTop: 4 }}>
          <button
            onClick={enviarAgora}
            disabled={rodando}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, border: `1px solid ${T.border}`,
              background: "#fff", color: T.text, fontWeight: 700, fontSize: 14, cursor: rodando ? "default" : "pointer", opacity: rodando ? 0.6 : 1,
            }}
          >
            <Play size={16} /> {rodando ? "Enviando..." : "Enviar agora"}
          </button>
          <span style={{ fontSize: 13, color: T.muted, flex: 1, minWidth: 220 }}>
            Faz na hora o envio das 09:00: lembretes das consultas de amanhã e cobranças que vencem daqui a {whatsapp.diasAntes} dia(s). Usa as configurações já salvas.
          </span>
        </div>
        {flash.envioAutomatico && (
          <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, background: "#F7F8FC", borderRadius: 10, padding: "10px 14px", marginTop: 12 }}>
            {flash.envioAutomatico}
          </div>
        )}
      </SettingsSection>

      <MessageTemplateField
        icon={CalendarClock}
        tone="primary"
        title="Mensagem de lembrete de sessão"
        description="Enviada às 09:00 do dia anterior à consulta, para confirmar a presença do paciente."
        value={whatsapp.lembrete}
        onChange={(v) => updateWhatsapp({ lembrete: v })}
        variables={WA_VARIABLES.lembrete}
        onTest={() => setTesting("lembrete")}
      />

      <MessageTemplateField
        icon={RefreshCw}
        tone="success"
        title="Mensagem de lembrete de retorno"
        description="Enviada a pacientes que estão há um tempo sem sessão, convidando para retomar o acompanhamento."
        value={whatsapp.retorno}
        onChange={(v) => updateWhatsapp({ retorno: v })}
        variables={WA_VARIABLES.retorno}
        onTest={() => setTesting("retorno")}
      />

      <MessageTemplateField
        icon={CircleDollarSign}
        tone="warn"
        title="Mensagem de cobrança"
        description="Enviada quando a cobrança da sessão está próxima do vencimento ou em atraso."
        value={whatsapp.cobranca}
        onChange={(v) => updateWhatsapp({ cobranca: v })}
        variables={WA_VARIABLES.cobranca}
        onTest={() => setTesting("cobranca")}
      />

      <MensagensWhatsapp mensagens={mensagens} />

      {testing && (
        <WhatsappQuickModal initialTemplate={testing} templates={whatsapp} onClose={() => setTesting(null)} />
      )}
    </>
  );
}
