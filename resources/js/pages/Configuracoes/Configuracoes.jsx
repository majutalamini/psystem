import { useState } from "react";
import { useAppData } from "../../hooks/useAppData";
import { Check, ChevronRight, Clock, ShieldCheck, Star, User } from "lucide-react";
import WhatsappIcon from "../../components/icons/WhatsappIcon";
import { Card, PageHeader, PrimaryButton } from "../../components/ui";
import { FONT_DISPLAY, T } from "../../styles/theme";
import HorarioTab from "./tabs/HorarioTab";
import MetasTab from "./tabs/MetasTab";
import PerfilTab from "./tabs/PerfilTab";
import SegurancaTab from "./tabs/SegurancaTab";
import WhatsappTab from "./tabs/WhatsappTab";

/* section: a parte do formulário (e dos erros do Laravel, ex. "perfil.nome") que cada aba edita. */
const SETTINGS_TABS = [
  { key: "pessoais", section: "perfil", label: "Dados pessoais", desc: "Perfil e contato", icon: User },
  { key: "seguranca", section: "senha", label: "Segurança", desc: "Senha e acesso", icon: ShieldCheck },
  { key: "horario", section: "horario", label: "Horário de atendimento", desc: "Dias e expediente", icon: Clock },
  { key: "metas", section: "goals", label: "Metas", desc: "Objetivos do consultório", icon: Star },
  { key: "whatsapp", section: "whatsapp", label: "WhatsApp", desc: "Mensagens automáticas", icon: WhatsappIcon },
];

/* O botão "Salvar alterações" manda todas as abas juntas; as abas só editam este estado. */
export default function Configuracoes({ goals, horario, whatsappModo, whatsappConexao, mensagensWhatsapp }) {
  const { auth, whatsapp, flash, errors = {}, saveSettings } = useAppData();
  const [tab, setTab] = useState("pessoais");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    perfil: { nome: auth.user.nome, crp: auth.user.crp, email: auth.user.email, telefone: auth.user.telefone || "" },
    senha: { atual: "", nova: "" },
    horario,
    goals,
    whatsapp: { ...whatsapp, numero: whatsapp.numero || "", lembrete: whatsapp.lembrete || "", retorno: whatsapp.retorno || "", cobranca: whatsapp.cobranca || "" },
  }));

  const update = (section) => (patch) => setForm((f) => ({ ...f, [section]: { ...f[section], ...patch } }));
  // Erros da seção sem o prefixo: errors["perfil.nome"] → sectionErrors("perfil").nome
  const sectionErrors = (section) => Object.fromEntries(
    Object.entries(errors).filter(([k]) => k.startsWith(`${section}.`)).map(([k, v]) => [k.slice(section.length + 1), v]),
  );
  const hasErrors = (section) => Object.keys(errors).some((k) => k.startsWith(`${section}.`));

  function handleSave() {
    setSaving(true);
    saveSettings(form, {
      onSuccess: () => setForm((f) => ({ ...f, senha: { atual: "", nova: "" } })),
      onError: (errs) => {
        const withError = SETTINGS_TABS.find((t) => Object.keys(errs).some((k) => k.startsWith(`${t.section}.`)));
        if (withError) setTab(withError.key);
      },
      onFinish: () => setSaving(false),
    });
  }

  const tabProps = (section) => ({ value: form[section], onChange: update(section), errors: sectionErrors(section) });
  // O erro do botão "Enviar mensagem de teste" (campo telefone) aparece na aba do WhatsApp, não no rodapé.
  const saveErrors = Object.keys(errors).filter((k) => k !== "telefone");
  const saved = flash.aviso && !saving && saveErrors.length === 0;

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
                {hasErrors(t.section) && <span title="Há campos com erro" style={{ width: 8, height: 8, borderRadius: "50%", background: T.danger, flexShrink: 0 }} />}
                {active && <ChevronRight size={18} color={T.primary} />}
              </button>
            );
          })}
        </Card>

        {/* Conteúdo */}
        <div>
          {tab === "pessoais" && <PerfilTab {...tabProps("perfil")} />}
          {tab === "seguranca" && <SegurancaTab {...tabProps("senha")} />}
          {tab === "horario" && <HorarioTab {...tabProps("horario")} />}
          {tab === "metas" && <MetasTab {...tabProps("goals")} />}
          {tab === "whatsapp" && <WhatsappTab {...tabProps("whatsapp")} modo={whatsappModo} conexao={whatsappConexao} mensagens={mensagensWhatsapp} />}

          <div style={{
            position: "sticky", bottom: 0, display: "flex", alignItems: "center", justifyContent: "flex-end",
            gap: 16, flexWrap: "wrap", padding: "16px 0 6px",
            background: `linear-gradient(to top, ${T.bg} 62%, rgba(245,247,252,0))`,
          }}>
            <span style={{
              display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 600,
              color: saved ? T.success : saveErrors.length ? T.danger : T.muted, marginRight: "auto",
            }}>
              {saved
                ? <><Check size={17} /> {flash.aviso}</>
                : saveErrors.length
                  ? "Corrija os campos destacados antes de salvar."
                  : "As alterações são aplicadas em todo o sistema ao salvar."}
            </span>
            <PrimaryButton style={{ padding: "14px 26px", fontSize: 15 }} icon={Check} onClick={handleSave} disabled={saving}>
              Salvar alterações
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
