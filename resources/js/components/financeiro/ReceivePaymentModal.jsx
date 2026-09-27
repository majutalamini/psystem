import { useState } from "react";
import { Check } from "lucide-react";
import { PAYMENT_METHODS } from "../../data/finance";
import { inputStyle } from "../../styles/formStyles";
import { T } from "../../styles/theme";
import { todayLabel } from "../../utils/date";
import { useAppData } from "../../hooks/useAppData";
import { ErrorText, Modal } from "../ui";

/* saldo: quanto falta receber (cobrança já recebida em parte). O valor sugerido é o saldo. */
export default function ReceivePaymentModal({ title, subtitle, valor, saldo = valor, vencimento, kind = "receber", onClose, onConfirm }) {
  const isPay = kind === "pagar";
  const { errors = {} } = useAppData();
  const [data, setData] = useState(todayLabel());
  const [valorRecebido, setValorRecebido] = useState(saldo);
  const [forma, setForma] = useState("Pix");

  return (
    <Modal title={isPay ? "Registrar pagamento" : "Registrar recebimento"} onClose={onClose} width={430}>
      <div style={{ background: isPay ? T.dangerTint : T.successTint, borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: T.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{subtitle}</div>}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, color: isPay ? T.danger : T.success }}>
            R$ {Number(valor).toLocaleString("pt-BR")}
          </span>
          <span style={{ fontSize: 12.5, color: T.muted }}>vence em {vencimento}</span>
        </div>
        {saldo < valor && (
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 6 }}>
            Já recebido: R$ {(valor - saldo).toLocaleString("pt-BR")} · falta R$ {Number(saldo).toLocaleString("pt-BR")}
          </div>
        )}
      </div>

      <label style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>Data do {isPay ? "pagamento" : "recebimento"}</label>
      <input value={data} onChange={(e) => setData(e.target.value)} placeholder="dd/mm/aaaa" style={inputStyle} />
      <ErrorText>{errors.data}</ErrorText>

      <label style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>Valor {isPay ? "pago" : "recebido"} (R$)</label>
      <input type="number" value={valorRecebido} onChange={(e) => setValorRecebido(e.target.value)} style={inputStyle} />
      <ErrorText>{errors.valor}</ErrorText>
      {!isPay && (
        <div style={{ fontSize: 12.5, color: T.muted, marginTop: -8, marginBottom: 16 }}>
          Se receber menos que o total, a cobrança continua em aberto com o restante.
        </div>
      )}

      <label style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>Forma de {isPay ? "pagamento" : "recebimento"}</label>
      <select value={forma} onChange={(e) => setForma(e.target.value)} style={inputStyle}>
        {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
      </select>

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancelar</button>
        <button
          onClick={() => onConfirm({ data, valor: Number(valorRecebido), forma })}
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
