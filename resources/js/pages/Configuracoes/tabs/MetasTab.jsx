import { Star } from "lucide-react";
import { useAppData } from "../../../hooks/useAppData";
import GoalField from "../components/GoalField";
import SettingsSection from "../components/SettingsSection";

export default function MetasTab() {
  const { goals, updateGoals } = useAppData();
  return (
    <SettingsSection
      icon={Star}
      tone="warn"
      title="Metas do consultório"
      description={'Essas metas alimentam os indicadores do Dashboard (como "Faturamento no mês" e "Horas na semana"), mostrando se você está no caminho certo.'}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0 20px" }}>
        <GoalField label="Meta de faturamento mensal" value={goals.faturamentoMensal} onChange={(v) => updateGoals({ faturamentoMensal: v })} prefix="R$" />
        <GoalField label="Meta de horas semanais" value={goals.horasSemanais} onChange={(v) => updateGoals({ horasSemanais: v })} suffix="horas" />
        <GoalField label="Meta de sessões semanais" value={goals.sessoesSemanais} onChange={(v) => updateGoals({ sessoesSemanais: v })} suffix="sessões" />
        <GoalField label="Meta de novos pacientes / mês" value={goals.novosPacientesMes} onChange={(v) => updateGoals({ novosPacientesMes: v })} suffix="pacientes" />
      </div>
    </SettingsSection>
  );
}
