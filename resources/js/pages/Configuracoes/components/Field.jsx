import { T } from "../../../styles/theme";
import { settingsInputStyle, settingsLabelStyle } from "./settingsStyles";

export default function Field({ label, defaultValue, value, onChange, type = "text", hint, error }) {
  const controlled = value !== undefined;
  const openPicker = (type === "time" || type === "date")
    ? (e) => { try { e.currentTarget.showPicker?.(); } catch {} }
    : undefined;

  return (
    <div style={{ marginBottom: 18 }}>
      <label style={settingsLabelStyle}>{label}</label>
      <input
        type={type}
        onClick={openPicker}
        {...(controlled ? { value, onChange: (e) => onChange(e.target.value) } : { defaultValue })}
        style={{
          ...(error ? { ...settingsInputStyle, borderColor: T.danger } : settingsInputStyle),
          ...(openPicker ? { cursor: "pointer" } : {}),
        }}
      />
      {error && <div style={{ fontSize: 12.5, color: T.danger, marginTop: 6 }}>{error}</div>}
      {hint && <div style={{ fontSize: 12.5, color: T.muted, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}
