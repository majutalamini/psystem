import { T } from "../../../styles/theme";
import { settingsInputStyle, settingsLabelStyle } from "./settingsStyles";

export default function GoalField({ label, value, onChange, prefix, suffix }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={settingsLabelStyle}>{label}</label>
      <div style={{ position: "relative" }}>
        {prefix && (
          <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", fontSize: 15.5, fontWeight: 600, color: T.muted }}>{prefix}</span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ ...settingsInputStyle, paddingLeft: prefix ? 40 : 15, paddingRight: suffix ? 64 : 15 }}
        />
        {suffix && (
          <span style={{ position: "absolute", right: 15, top: "50%", transform: "translateY(-50%)", fontSize: 13.5, color: T.muted }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}
