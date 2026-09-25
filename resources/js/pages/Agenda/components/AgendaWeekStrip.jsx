import { ChevronLeft, ChevronRight } from "lucide-react";
import { WEEKDAY_LABELS } from "../../../data/agenda";
import { iconBtn } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import { TODAY, weekdayIndex } from "../../../utils/date";

export default function AgendaWeekStrip({ dayOffset, onSelectDay, events }) {
  const weekStart = dayOffset - weekdayIndex(dayOffset);
  const baseDate = TODAY;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <button onClick={() => onSelectDay(weekStart - 7)} style={iconBtn}><ChevronLeft size={19} /></button>
      <div style={{ display: "flex", gap: 6, flex: 1 }}>
        {WEEKDAY_LABELS.map((label, i) => {
          const offset = weekStart + i;
          const d = new Date(baseDate);
          d.setDate(baseDate.getDate() + offset);
          const isToday = offset === 0;
          const isSelected = offset === dayOffset;
          const count = (events[offset] || []).filter((e) => !e.isBreak).length;
          return (
            <button
              key={offset}
              onClick={() => onSelectDay(offset)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 4px",
                borderRadius: 10, cursor: "pointer",
                border: isSelected ? `1.5px solid ${T.primary}` : `1px solid ${T.border}`,
                background: isSelected ? T.primaryTint : "#fff",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: isSelected ? T.primaryDark : T.muted, textTransform: "uppercase" }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: isToday ? T.primary : T.text }}>{d.getDate()}</span>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: count > 0 ? T.primary : "transparent" }} />
            </button>
          );
        })}
      </div>
      <button onClick={() => onSelectDay(weekStart + 7)} style={iconBtn}><ChevronRight size={19} /></button>
    </div>
  );
}
