import { CalendarDays, Clock } from "lucide-react";
import { T } from "../../../styles/theme";
import Field from "../components/Field";
import GoalField from "../components/GoalField";
import SettingsSection from "../components/SettingsSection";
import { settingsLabelStyle } from "../components/settingsStyles";

const ALL_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function HorarioTab({ value, onChange, errors }) {
  const days = value.dias || [];
  const toggleDay = (d) => onChange({ dias: days.includes(d) ? days.filter((x) => x !== d) : ALL_DAYS.filter((x) => x === d || days.includes(x)) });

  return (
    <SettingsSection
      icon={Clock}
      title="Horário de atendimento"
      description="Define os dias e a faixa de horário disponíveis na agenda. Os horários da agenda são as horas cheias do expediente (08:00–18:00 → 08:00 a 17:00)."
    >
      <label style={settingsLabelStyle}>Dias de atendimento</label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        {ALL_DAYS.map((d) => {
          const on = days.includes(d);
          return (
            <button
              key={d}
              onClick={() => toggleDay(d)}
              style={{
                width: 64, height: 54, borderRadius: 12, border: `1.5px solid ${on ? T.primary : T.border}`,
                background: on ? T.primaryTint : "#fff", color: on ? T.primaryDark : T.muted,
                fontWeight: 700, fontSize: 15, cursor: "pointer", transition: "all .12s",
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 20px" }}>
        <Field label="Início do expediente" type="time" value={value.inicio} onChange={(v) => onChange({ inicio: v })} error={errors.inicio} />
        <Field label="Término do expediente" type="time" value={value.fim} onChange={(v) => onChange({ fim: v })} error={errors.fim} />
        <GoalField label="Duração padrão da sessão" value={value.duracao} onChange={(v) => onChange({ duracao: v })} suffix="minutos" error={errors.duracao} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: T.muted, marginTop: 6 }}>
        <CalendarDays size={17} /> {days.length} {days.length === 1 ? "dia" : "dias"} por semana selecionados.
      </div>
    </SettingsSection>
  );
}
