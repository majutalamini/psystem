import { inputStyle, textareaStyle } from "../../styles/formStyles";
import { T } from "../../styles/theme";
import DateInput from "./DateInput";
import ErrorText from "./ErrorText";

/* options aceita strings ou { value, label }. */
export default function FormField({ label, value, onChange, type = "text", placeholder, textarea, minHeight, options, error, inputMode, maxLength }) {
  const style = error ? { ...inputStyle, borderColor: T.danger } : inputStyle;
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
        <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ ...textareaStyle, ...(minHeight ? { minHeight } : null), ...(error ? { borderColor: T.danger } : null) }} />
      ) : placeholder === "dd/mm/aaaa" ? (
        <DateInput value={value} onChange={onChange} style={style} noFuture={/nascimento/i.test(label)} />
      ) : (
        <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={style} inputMode={inputMode} maxLength={maxLength} />
      )}
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
