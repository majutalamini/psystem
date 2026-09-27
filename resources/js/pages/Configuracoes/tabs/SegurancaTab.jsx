import { ShieldCheck } from "lucide-react";
import Field from "../components/Field";
import SettingsSection from "../components/SettingsSection";

export default function SegurancaTab({ value, onChange, errors }) {
  return (
    <SettingsSection
      icon={ShieldCheck}
      tone="success"
      title="Segurança da conta"
      description="Prontuários são dados sensíveis. Use uma senha forte. Deixe os campos em branco para manter a senha atual."
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0 20px" }}>
        <Field label="Senha atual" type="password" value={value.atual} onChange={(v) => onChange({ atual: v })} error={errors.atual} />
        <Field
          label="Nova senha" type="password" value={value.nova} onChange={(v) => onChange({ nova: v })} error={errors.nova}
          hint="Use ao menos 8 caracteres, com números e símbolos."
        />
      </div>
    </SettingsSection>
  );
}
