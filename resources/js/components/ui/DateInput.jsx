import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import { format, parse, isValid } from "date-fns";
import "react-day-picker/style.css";
import { inputStyle } from "../../styles/formStyles";
import { T } from "../../styles/theme";
import { maskDate } from "../../utils/format";

const FMT = "dd/MM/yyyy";

/* Campo de data: digitação com máscara + calendário (React DayPicker) em popover.
   O valor continua sendo a string "dd/mm/aaaa"; onChange recebe a string. */
export default function DateInput({ value, onChange, placeholder = "dd/mm/aaaa", style, noFuture, ...rest }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const parsed = parse(value || "", FMT, new Date());
  const selected = isValid(parsed) ? parsed : undefined;

  return (
    <div ref={ref} style={{ position: "relative", "--rdp-accent-color": T.primary }}>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(maskDate(e.target.value))}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder={placeholder}
        inputMode="numeric"
        maxLength={10}
        autoComplete="off"
        style={style ?? inputStyle}
        {...rest}
      />
      {open && (
        <div style={{ position: "absolute", zIndex: 1000, top: "calc(100% - 12px)", left: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.14)", padding: 6 }}>
          <DayPicker
            mode="single"
            locale={ptBR}
            captionLayout="dropdown"
            startMonth={new Date(1900, 0)}
            endMonth={noFuture ? new Date() : new Date(2100, 11)}
            disabled={noFuture ? { after: new Date() } : undefined}
            selected={selected}
            defaultMonth={selected}
            onSelect={(d) => { if (d) { onChange(format(d, FMT)); setOpen(false); } }}
          />
        </div>
      )}
    </div>
  );
}
