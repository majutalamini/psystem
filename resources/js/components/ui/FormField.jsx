import { inputStyle, textareaStyle } from "../../styles/formStyles";
import { T } from "../../styles/theme";
import ErrorText from "./ErrorText";

/* options aceita strings ou { value, label }. */
export default function FormField({ label, value, onChange, type = "text", placeholder, textarea, options, error }) {
  const style = error ? { ...inputStyle, borderColor: T.danger, marginBottom: 4 } : inputStyle;
  return (
    <div>
      <label style={{ fontSize: 13.5, fontWeight: 600, color: T.muted }}>{label}</label>
      {options ? (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={style}>
          {options.map((o) => (typeof o === "string"
            ? <option key={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>))}
        </select>
      ) : textarea ? (
        <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={error ? { ...textareaStyle, borderColor: T.danger, marginBottom: 4 } : textareaStyle} />
      ) : (
        <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={style} />
      )}
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
