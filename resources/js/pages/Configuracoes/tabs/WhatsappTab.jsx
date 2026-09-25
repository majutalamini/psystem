import { useState } from "react";
import { CalendarClock, CircleDollarSign, RefreshCw } from "lucide-react";
import WhatsappIcon from "../../../components/icons/WhatsappIcon";
import { Switch } from "../../../components/ui";
import WhatsappQuickModal from "../../../components/whatsapp/WhatsappQuickModal";
import { WA_VARIABLES } from "../../../data/whatsapp";
import { useAppData } from "../../../hooks/useAppData";
import { T } from "../../../styles/theme";
import Field from "../components/Field";
import GoalField from "../components/GoalField";
import MessageTemplateField from "../components/MessageTemplateField";
import SettingsSection from "../components/SettingsSection";

export default function WhatsappTab() {
  const { whatsapp, updateWhatsapp } = useAppData();
  const [testing, setTesting] = useState(null); // chave do modelo em teste

  return (
    <>
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
              {whatsapp.enabled ? "Envio automático ativo para todos os pacientes." : "Envio automático desligado."}
            </div>
          </div>
          <Switch checked={whatsapp.enabled} onChange={(v) => updateWhatsapp({ enabled: v })} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0 20px" }}>
          <Field
            label="Número do WhatsApp comercial"
            value={whatsapp.numero}
            onChange={(v) => updateWhatsapp({ numero: v })}
            hint="É o número que aparece como remetente das mensagens."
          />
          <GoalField
            label="Enviar cobrança antes do vencimento"
            value={whatsapp.diasAntes}
            onChange={(v) => updateWhatsapp({ diasAntes: v })}
            suffix="dias antes"
          />
        </div>
      </SettingsSection>

      <MessageTemplateField
        icon={CalendarClock}
        tone="primary"
        title="Mensagem de lembrete de sessão"
        description="Enviada antes da consulta agendada, para confirmar a presença do paciente."
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
        description="Enviada quando a mensalidade está próxima do vencimento ou em atraso."
        value={whatsapp.cobranca}
        onChange={(v) => updateWhatsapp({ cobranca: v })}
        variables={WA_VARIABLES.cobranca}
        onTest={() => setTesting("cobranca")}
      />

      {testing && (
        <WhatsappQuickModal initialTemplate={testing} onClose={() => setTesting(null)} />
      )}
    </>
  );
}
