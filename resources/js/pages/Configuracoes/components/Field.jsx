import { T } from "../../../styles/theme";
import { isValidTime, maskTime } from "../../../utils/format";
import { settingsInputStyle, settingsLabelStyle } from "./settingsStyles";
import { useId } from "react";

/* type="time" vira um campo de texto com máscara HH:MM: o seletor nativo aceitava horário incompleto e mandava vazio sem avisar. */
export default function Field({ label, defaultValue, value, onChange, type = "text", hint, error, required = false }) {
  const id = useId();
  if (type === "time") {
    const incompleto = value && !isValidTime(value);
    const mensagem = error || (incompleto ? "Horário inválido. Use HH:MM, entre 00:00 e 23:59." : null);
    return (
      <div style={{ marginBottom: 18 }}>
        <label htmlFor={id} style={settingsLabelStyle}>{label}</label>
        <input
          id={id}
          type="text"
          required={required}
          aria-invalid={mensagem ? true : undefined}
          aria-describedby={mensagem ? `${id}-erro` : undefined}
          inputMode="numeric"
          placeholder="HH:MM"
          maxLength={5}
          value={value ?? ""}
          onChange={(e) => onChange(maskTime(e.target.value))}
          style={mensagem ? { ...settingsInputStyle, borderColor: T.danger } : settingsInputStyle}
        />
        {mensagem && <div id={`${id}-erro`} style={{ fontSize: 12.5, color: T.danger, marginTop: 6 }}>{mensagem}</div>}
        {hint && <div style={{ fontSize: 12.5, color: T.muted, marginTop: 6 }}>{hint}</div>}
      </div>
    );
  }

  const controlled = value !== undefined;
  const openPicker = type === "date"
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
