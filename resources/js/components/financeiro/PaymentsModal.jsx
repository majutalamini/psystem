import { Undo2 } from "lucide-react";
import { T } from "../../styles/theme";
import { formatMoney } from "../../utils/format";
import { pedirTexto } from "../../utils/alertas";
import { Modal, Pill } from "../ui";

/* Pagamentos de uma cobrança ou despesa. Qualquer pagamento válido pode ser estornado, com motivo;
   o estornado continua na lista (com data e motivo) e não entra mais na soma. */
export default function PaymentsModal({ title, subtitle, pagamentos = [], onReverse, onClose }) {
  async function estornar(p) {
    const motivo = await pedirTexto({
      titulo: "Estornar este pagamento?",
      texto: `R$ ${formatMoney(p.valor)} de ${p.data} (${p.forma}). O pagamento continua no histórico como estornado e o valor volta a ficar em aberto.`,
      rotulo: "Motivo do estorno",
      confirmar: "Estornar",
    });
    if (motivo) onReverse(p.id, motivo);
  }

  return (
    <Modal title="Pagamentos e estornos" onClose={onClose} width={520}>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: T.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>{subtitle}</div>}

      {pagamentos.length === 0 ? (
        <div style={{ fontSize: 13.5, color: T.muted, padding: "14px 0" }}>Nenhum pagamento registrado.</div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {pagamentos.map((p) => (
            <li key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: `1px solid ${T.border}`, opacity: p.estornado ? 0.7 : 1 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, textDecoration: p.estornado ? "line-through" : "none" }}>
                  R$ {formatMoney(p.valor)} <span style={{ fontWeight: 500, color: T.muted }}>· {p.data} · {p.forma}</span>
                </div>
                {p.estornado && (
                  <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>Estornado em {p.estornadoEm}: {p.motivoEstorno}</div>
                )}
              </div>
              {p.estornado ? (
                <Pill tone="muted">Estornado</Pill>
              ) : (
                <button
                  onClick={() => estornar(p)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.danger, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}
                >
                  <Undo2 size={15} /> Estornar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
