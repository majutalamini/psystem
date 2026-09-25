import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Switch } from "../../../components/ui";
import { T } from "../../../styles/theme";
import Field from "../components/Field";
import SettingsSection from "../components/SettingsSection";

export default function SegurancaTab() {
  const [twoFactor, setTwoFactor] = useState(false);
  return (
    <SettingsSection
      icon={ShieldCheck}
      tone="success"
      title="Segurança da conta"
      description="Prontuários são dados sensíveis. Use uma senha forte e mantenha a verificação em duas etapas ativa."
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0 20px" }}>
        <Field label="Senha atual" type="password" defaultValue="" />
        <Field label="Nova senha" type="password" defaultValue="" hint="Use ao menos 8 caracteres, com números e símbolos." />
      </div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 18px", marginTop: 8,
      }}>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: T.text }}>Autenticação em duas etapas</div>
          <div style={{ fontSize: 13.5, color: T.muted, marginTop: 3 }}>Exigir um código adicional ao entrar na conta.</div>
        </div>
        <Switch checked={twoFactor} onChange={setTwoFactor} />
      </div>
    </SettingsSection>
  );
}
