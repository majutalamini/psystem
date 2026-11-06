import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { inputStyle } from "../../styles/formStyles";
import { T } from "../../styles/theme";

export function normalizeTime(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  let hours, minutes;
  if (/^\d{1,2}:\d{2}$/.test(text)) [hours, minutes] = text.split(":");
  else if (/^\d{3,4}$/.test(text)) { hours = text.slice(0, -2); minutes = text.slice(-2); }
  else if (/^\d{1,2}$/.test(text)) { hours = text; minutes = "00"; }
  else return null;
  if (Number(hours) > 23 || Number(minutes) > 59) return null;
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

export function isTimeAllowed(value, options) {
  const normalized = normalizeTime(value);
  return !!normalized && (!options || options.includes(normalized));
}

const CLOCK_OPTIONS = Array.from({ length: 96 }, (_, index) => `${String(Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}`);

export default function TimeInput({ label = "Horário", value, onChange, options, required = false, error, hint, style = {} }) {
  const id = useId(), input = useRef(null), wrapper = useRef(null), list = useRef(null);
  const [open, setOpen] = useState(false), [active, setActive] = useState(0), [touched, setTouched] = useState(false);
  const choices = options || CLOCK_OPTIONS, normalized = normalizeTime(value);
  const invalid = normalized === null || (required && !normalized) || (!!normalized && !!options && !options.includes(normalized));
  const localError = normalized === null ? "Informe um horário válido (HH:MM)."
    : !normalized ? "Informe o horário." : "Escolha um horário disponível na lista.";
  const message = error || (touched && invalid ? localError : "");
  useEffect(() => {
    const close = event => { if (!wrapper.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);
  useEffect(() => { if (active >= choices.length) setActive(0); }, [choices.length, active]);

  function commit() {
    setTouched(true);
    if (normalized !== null && normalized !== value) onChange(normalized);
  }
  function choose(time) { onChange(time); setTouched(true); setOpen(false); input.current?.focus(); }
  function show() {
    const index = choices.indexOf(normalized);
    setActive(index < 0 ? 0 : index); setOpen(true); input.current?.focus();
  }
  function keyDown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) show();
      else setActive(index => (index + (event.key === "ArrowDown" ? 1 : -1) + choices.length) % Math.max(1, choices.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (open && choices[active]) choose(choices[active]); else commit();
    } else if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
    else if (event.key === "Tab") { setOpen(false); commit(); }
  }
  function paste(event) {
    const text = event.clipboardData.getData("text/plain"), parsed = normalizeTime(text);
    if (text.trim().length >= 3 && parsed) { event.preventDefault(); onChange(parsed); setTouched(true); }
  }
  return <div ref={wrapper} style={{ position: "relative", marginBottom: 16 }}>
    <label htmlFor={id} style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: T.muted, marginBottom: 4 }}>{label}</label>
    <div style={{ position: "relative" }}>
      <input ref={input} id={id} type="text" role="combobox" inputMode="numeric" autoComplete="off" spellCheck={false}
        placeholder="HH:MM" maxLength={8} value={value ?? ""} onChange={event => onChange(event.target.value)} onPaste={paste}
        onBlur={commit} onKeyDown={keyDown} aria-expanded={open} aria-controls={open ? `${id}-list` : undefined}
        aria-activedescendant={open && choices[active] ? `${id}-option-${active}` : undefined} aria-autocomplete="none"
        aria-required={required} aria-invalid={!!message} aria-describedby={`${id}-hint${message ? ` ${id}-error` : ""}`}
        style={{ ...inputStyle, ...style, marginBottom: 0, width: "100%", paddingRight: 54, ...(message ? { borderColor: T.danger } : {}) }} />
      <button type="button" tabIndex={-1} aria-label={`Abrir seletor de ${label.toLowerCase()}`} aria-expanded={open} disabled={!choices.length}
        onMouseDown={event => event.preventDefault()} onClick={() => open ? setOpen(false) : show()}
        style={{ position: "absolute", right: 6, top: 3, bottom: 3, display: "flex", alignItems: "center", gap: 2,
          border: 0, borderRadius: 7, background: T.surface, color: T.muted, cursor: "pointer" }}><Clock size={16} /><ChevronDown size={13} /></button>
    </div>
    <div id={`${id}-hint`} style={{ fontSize: 11.5, color: T.muted, marginTop: 4 }}>{hint || "Digite HH:MM ou HHMM; use as setas para escolher."}</div>
    {message && <div id={`${id}-error`} role="alert" style={{ fontSize: 12.5, color: T.danger, marginTop: 4 }}>{message}</div>}
    {open && <div ref={list} id={`${id}-list`} role="listbox" aria-label={`Opções de ${label.toLowerCase()}`}
      style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 90, maxHeight: 220, overflowY: "auto", padding: 4,
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, boxShadow: "0 8px 25px rgba(0,0,0,.18)" }}>
      {choices.map((time, index) => <button type="button" tabIndex={-1} key={time} id={`${id}-option-${index}`} role="option" data-index={index}
        aria-selected={time === normalized} onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(time)}
        style={{ display: "block", width: "100%", padding: "9px 12px", textAlign: "left", border: 0, borderRadius: 6,
          background: index === active ? T.primaryTint : T.surface, color: index === active ? T.primaryDark : T.text, cursor: "pointer" }}>{time}</button>)}
    </div>}
  </div>;
}
