import { useId } from "react";
import { inputStyle, textareaStyle } from "../../styles/formStyles";
import { T } from "../../styles/theme";
import DateInput from "./DateInput";
import ErrorText from "./ErrorText";

/* options aceita strings ou { value, label }. O rótulo fica ligado ao campo (leitores de tela e testes
   encontram o campo pelo nome) e o erro é anunciado junto do campo. */
export default function FormField({ label, value, onChange, type = "text", placeholder, textarea, minHeight, options, error, inputMode, maxLength, list }) {
  const id = useId();
  const erroId = `${id}-erro`;
  const style = error ? { ...inputStyle, borderColor: T.danger } : inputStyle;
  const a11y = { id, "aria-invalid": error ? true : undefined, "aria-describedby": error ? erroId : undefined };
  return (
    <div>
      <label htmlFor={id} style={{ fontSize: 13.5, fontWeight: 600, color: T.muted }}>{label}</label>
      {options ? (
        <select {...a11y} value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={style}>
          {options.map((o) => (typeof o === "string"
            ? <option key={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>))}
        </select>
      ) : textarea ? (
        <textarea {...a11y} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ ...textareaStyle, ...(minHeight ? { minHeight } : null), ...(error ? { borderColor: T.danger } : null) }} />
      ) : placeholder === "dd/mm/aaaa" ? (
        <DateInput {...a11y} value={value} onChange={onChange} style={style} noFuture={/nascimento/i.test(label)} />
      ) : (
        <>
          <input {...a11y} type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={style} inputMode={inputMode} maxLength={maxLength} list={list ? `${id}-lista` : undefined} />
          {list && <datalist id={`${id}-lista`}>{list.map((o) => <option key={o} value={o} />)}</datalist>}
        </>
      )}
      <ErrorText id={erroId}>{error}</ErrorText>
    </div>
  );
}
