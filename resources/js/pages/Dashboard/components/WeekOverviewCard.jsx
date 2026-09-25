import { ChevronRight } from "lucide-react";
import { Card } from "../../../components/ui";
import { WEEK_OVERVIEW } from "../../../data/dashboard";
import { T } from "../../../styles/theme";

export default function WeekOverviewCard({ onNavigate }) {
  const max = Math.max(...WEEK_OVERVIEW.map((d) => d.count), 1);
  const total = WEEK_OVERVIEW.reduce((s, d) => s + d.count, 0);
  return (
    <Card style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Sua semana</div>
          <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>{total} sessões previstas · semana de 17 a 23/08</div>
        </div>
        <button onClick={() => onNavigate("agenda")} style={{ background: "none", border: "none", color: T.primary, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
          Ver agenda <ChevronRight size={16} />
        </button>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {WEEK_OVERVIEW.map((d) => (
          <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: "100%", height: 70, background: "#F1F3F9", borderRadius: 8, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
              <div
                style={{
                  width: "100%", height: `${Math.max((d.count / max) * 100, d.count > 0 ? 10 : 0)}%`,
                  background: d.active ? T.primary : T.primaryTint, borderRadius: "8px 8px 0 0", transition: "height .2s",
                }}
              />
            </div>
            <span style={{ fontSize: 12, fontWeight: d.active ? 800 : 600, color: d.active ? T.primary : T.muted }}>{d.day}</span>
            <span style={{ fontSize: 11.5, color: T.muted, marginTop: -6 }}>{d.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
