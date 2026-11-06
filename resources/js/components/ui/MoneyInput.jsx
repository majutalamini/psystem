import { useState } from "react";
import CurrencyInput from "react-currency-input-field";

const toText = (v) => {
  if (v === "" || v == null || Number.isNaN(Number(v))) return "";
  return Number(v).toFixed(2).replace(".", ",");
};

const toNumber = (t) => {
  const n = parseFloat(String(t ?? "").replace(",", "."));
  return Number.isNaN(n) ? "" : n;
};

/*
 * Campo em reais com máscara automática (react-currency-input-field): "10000" vira "R$ 10.000,00" ao digitar.
 * value/onChange trabalham com número (150.5); campo vazio devolve "".
 */
export default function MoneyInput({ value, onChange, style, placeholder = "R$ 0,00", id }) {
  const [text, setText] = useState(() => toText(value));

  // Valor trocado por fora (ex.: outro paciente escolhido): mostra o novo.
  const atual = value === undefined || value === null ? "" : value;
  if (toNumber(text) !== atual && toText(atual) !== text) {
    setText(toText(atual));
  }

  return (
    <CurrencyInput
      prefix="R$ "
      decimalSeparator=","
      groupSeparator="."
      decimalScale={2}
      allowNegativeValue={false}
      id={id}
      inputMode="decimal"
      placeholder={placeholder}
      value={text}
      style={style}
      onValueChange={(v, _nome, valores) => {
        setText(v ?? "");
        onChange(valores && valores.float != null ? valores.float : "");
      }}
    />
  );
}
