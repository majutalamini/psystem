import { useState } from "react";
import { Check, ChevronRight, Clock, ShieldCheck, Star, User } from "lucide-react";
import WhatsappIcon from "../../components/icons/WhatsappIcon";
import { Card, PageHeader, PrimaryButton } from "../../components/ui";
import { FONT_DISPLAY, T } from "../../styles/theme";
import HorarioTab from "./tabs/HorarioTab";
import MetasTab from "./tabs/MetasTab";
import PerfilTab from "./tabs/PerfilTab";
import SegurancaTab from "./tabs/SegurancaTab";
import WhatsappTab from "./tabs/WhatsappTab";

const SETTINGS_TABS = [
  { key: "pessoais", label: "Dados pessoais", desc: "Perfil e contato", icon: User },
  { key: "seguranca", label: "Segurança", desc: "Senha e acesso", icon: ShieldCheck },
  { key: "horario", label: "Horário de atendimento", desc: "Dias e expediente", icon: Clock },
  { key: "metas", label: "Metas", desc: "Objetivos do consultório", icon: Star },
  { key: "whatsapp", label: "WhatsApp", desc: "Mensagens automáticas", icon: WhatsappIcon },
];

export default function Configuracoes() {
  const [tab, setTab] = useState("pessoais");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2600);
  }

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Gerencie seu perfil e as preferências do consultório" />

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 26, alignItems: "start" }}>
        {/* Navegação das configurações */}
        <Card style={{ padding: 10, position: "sticky", top: 0 }}>
          {SETTINGS_TABS.map((t) => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 13, width: "100%", textAlign: "left",
                  padding: "13px 13px", borderRadius: 12, border: "none", cursor: "pointer",
                  background: active ? T.primaryTint : "transparent", marginBottom: 2,
                  transition: "background .12s",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#F5F6FA"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                  background: active ? "#fff" : "#F3F5FB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={20} color={active ? T.primary : T.muted} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, fontWeight: active ? 700 : 600, color: active ? T.primaryDark : T.text, letterSpacing: -0.2 }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: 12.5, color: T.muted, marginTop: 1 }}>{t.desc}</div>
                </div>
                {active && <ChevronRight size={18} color={T.primary} />}
              </button>
            );
          })}
        </Card>

        {/* Conteúdo */}
        <div>
          {tab === "pessoais" && <PerfilTab />}
          {tab === "seguranca" && <SegurancaTab />}
          {tab === "horario" && <HorarioTab />}
          {tab === "metas" && <MetasTab />}
          {tab === "whatsapp" && <WhatsappTab />}

          <div style={{
            position: "sticky", bottom: 0, display: "flex", alignItems: "center", justifyContent: "flex-end",
            gap: 16, flexWrap: "wrap", padding: "16px 0 6px",
            background: `linear-gradient(to top, ${T.bg} 62%, rgba(245,247,252,0))`,
          }}>
            <span style={{
              display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 600,
              color: saved ? T.success : T.muted, marginRight: "auto",
            }}>
              {saved
                ? <><Check size={17} /> Alterações salvas com sucesso.</>
                : "As alterações são aplicadas em todo o sistema imediatamente."}
            </span>
            <PrimaryButton style={{ padding: "14px 26px", fontSize: 15 }} icon={Check} onClick={handleSave}>
              Salvar alterações
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
