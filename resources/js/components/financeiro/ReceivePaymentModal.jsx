import { useId, useState } from "react";
import { Check } from "lucide-react";
import { PAYMENT_METHODS } from "../../data/finance";
import { inputStyle } from "../../styles/formStyles";
import { T } from "../../styles/theme";
import { todayLabel } from "../../utils/date";
import { useAppData } from "../../hooks/useAppData";
import { ErrorText, Modal, MoneyInput } from "../ui";
import { formatMoney } from "../../utils/format";
import DateInput from "../ui/DateInput";

const novaChave = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/* saldo: quanto falta receber/pagar (conta já quitada em parte). O valor sugerido é o saldo.
   A chave identifica este envio: se ele chegar duas vezes ao servidor, só um pagamento é gravado. */
export default function ReceivePaymentModal({ title, subtitle, valor, saldo = valor, vencimento, kind = "receber", onClose, onConfirm }) {
  const isPay = kind === "pagar";
  const { errors = {} } = useAppData();
  const [data, setData] = useState(todayLabel());
  const [valorRecebido, setValorRecebido] = useState(saldo);
  const [forma, setForma] = useState("Pix");
  const [chave] = useState(novaChave);
  const id = useId();

  return (
    <Modal title={isPay ? "Registrar pagamento" : "Registrar recebimento"} onClose={onClose} width={430}>
      <div style={{ background: isPay ? T.dangerTint : T.successTint, borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: T.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{subtitle}</div>}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, color: isPay ? T.danger : T.success }}>
            R$ {formatMoney(Number(valor))}
          </span>
          <span style={{ fontSize: 12.5, color: T.muted }}>vence em {vencimento}</span>
        </div>
        {saldo < valor && (
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 6 }}>
            Já {isPay ? "pago" : "recebido"}: R$ {formatMoney(valor - saldo)} · falta R$ {formatMoney(Number(saldo))}
          </div>
        )}
      </div>

      <label htmlFor={`${id}-data`} style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>Data do {isPay ? "pagamento" : "recebimento"}</label>
      <DateInput id={`${id}-data`} value={data} onChange={(v) => setData(v)} style={inputStyle} />
      <ErrorText>{errors.data}</ErrorText>

      <label htmlFor={`${id}-valor`} style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>Valor {isPay ? "pago" : "recebido"} (R$)</label>
      <MoneyInput id={`${id}-valor`} value={valorRecebido} onChange={setValorRecebido} style={errors.valor ? { ...inputStyle, borderColor: T.danger, marginBottom: 4 } : inputStyle} />
      <ErrorText>{errors.valor}</ErrorText>
      <div style={{ fontSize: 12.5, color: T.muted, marginTop: -8, marginBottom: 16 }}>
        {isPay
          ? "Se pagar menos que o total, a despesa continua em aberto com o restante."
          : "Se receber menos que o total, a cobrança continua em aberto com o restante."}
      </div>

      <label htmlFor={`${id}-forma`} style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>Forma de {isPay ? "pagamento" : "recebimento"}</label>
      <select id={`${id}-forma`} value={forma} onChange={(e) => setForma(e.target.value)} style={inputStyle}>
        {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
      </select>

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancelar</button>
        <button
          onClick={() => onConfirm({ data, valor: valorRecebido, forma, chave })}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "11px 0", borderRadius: 10, border: "none", cursor: "pointer",
            background: isPay ? T.danger : T.success, color: "#fff", fontWeight: 700, fontSize: 14,
          }}
        >
          <Check size={18} /> Confirmar {isPay ? "pagamento" : "recebimento"}
        </button>
      </div>
    </Modal>
  );
}
