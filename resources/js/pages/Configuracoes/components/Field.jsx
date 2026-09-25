import { T } from "../../../styles/theme";
import { settingsInputStyle, settingsLabelStyle } from "./settingsStyles";

export default function Field({ label, defaultValue, value, onChange, type = "text", hint }) {
  const controlled = value !== undefined;
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={settingsLabelStyle}>{label}</label>
      <input
        type={type}
        {...(controlled ? { value, onChange: (e) => onChange(e.target.value) } : { defaultValue })}
        style={settingsInputStyle}
      />
      {hint && <div style={{ fontSize: 12.5, color: T.muted, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}
