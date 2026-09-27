import { useState } from "react";
import { parseMoney, sanitizeMoney } from "../../utils/format";

const toText = (v) => {
  if (v === "" || v == null || Number.isNaN(Number(v))) return "";
  const n = Number(v);
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");
};

/*
 * Campo em reais: aceita só dígitos e uma vírgula com até 2 casas ("150,50").
 * value/onChange trabalham com número; enquanto o texto está vazio ou incompleto ("150,") o valor é "".
 */
export default function MoneyInput({ value, onChange, style, placeholder = "0,00" }) {
  const [text, setText] = useState(() => toText(value));

  // Valor trocado por fora (ex.: outro paciente escolhido): mostra o novo.
  const atual = value === undefined || value === null ? "" : value;
  if ((parseMoney(text) ?? "") !== atual && toText(atual) !== text) {
    setText(toText(atual));
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={text}
      style={style}
      onChange={(e) => {
        const t = sanitizeMoney(e.target.value);
        setText(t);
        onChange(parseMoney(t) ?? "");
      }}
    />
  );
}
