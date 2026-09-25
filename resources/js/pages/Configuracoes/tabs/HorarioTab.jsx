import { useState } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { T } from "../../../styles/theme";
import Field from "../components/Field";
import SettingsSection from "../components/SettingsSection";
import { settingsLabelStyle } from "../components/settingsStyles";

const ALL_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function HorarioTab() {
  const [days, setDays] = useState(["Seg", "Ter", "Qua", "Qui", "Sex"]);
  const toggleDay = (d) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  return (
    <SettingsSection
      icon={Clock}
      title="Horário de atendimento"
      description="Define os dias e a faixa de horário disponíveis na agenda para novos agendamentos."
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
        <Field label="Início do expediente" defaultValue="08:00" />
        <Field label="Término do expediente" defaultValue="18:00" />
        <Field label="Duração padrão da sessão" defaultValue="50 minutos" />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: T.muted, marginTop: 6 }}>
        <CalendarDays size={17} /> {days.length} {days.length === 1 ? "dia" : "dias"} por semana selecionados.
      </div>
    </SettingsSection>
  );
}
