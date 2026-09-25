import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Banknote, Check, CircleDollarSign, Clock, MessageSquare, Plus, TrendingDown, TrendingUp, Undo2, Wallet } from "lucide-react";
import NewReceivableModal from "../../components/financeiro/NewReceivableModal";
import ReceivePaymentModal from "../../components/financeiro/ReceivePaymentModal";
import { Card, PageHeader, Pill, PrimaryButton, RowMenu, StatCard } from "../../components/ui";
import WhatsappQuickModal from "../../components/whatsapp/WhatsappQuickModal";
import { initialPayables } from "../../data/finance";
import { useAppData } from "../../hooks/useAppData";
import { T } from "../../styles/theme";
import { TODAY, parseBrDate } from "../../utils/date";
import { statusTone } from "../../utils/format";
import NewPayableModal from "./components/NewPayableModal";

export default function Financeiro() {
  const { patients, receivables, addReceivable, receiveReceivable, reopenReceivable } = useAppData();
  const [tab, setTab] = useState("receber"); // 'receber' | 'pagar'
  const [payables, setPayables] = useState(initialPayables);
  const [showReceivableModal, setShowReceivableModal] = useState(false);
  const [showPayableModal, setShowPayableModal] = useState(false);
  const [receiving, setReceiving] = useState(null);   // conta a receber em baixa
  const [paying, setPaying] = useState(null);         // conta a pagar em baixa
  const [cobrandoId, setCobrandoId] = useState(null); // cobrança via WhatsApp

  /* Baixa de uma despesa: marca como paga e guarda data/valor/forma. */
  function payPayable(id, payment) {
    setPayables((prev) => prev.map((x) => (
      x.id === id ? { ...x, status: "Pago", pagamento: payment.data, pago: Number(payment.valor), forma: payment.forma } : x
    )));
  }

  function reopenPayable(id) {
    setPayables((prev) => prev.map((x) => {
      if (x.id !== id) return x;
      const venc = parseBrDate(x.vencimento);
      return { ...x, status: venc && venc < TODAY ? "Atrasado" : "Pendente", pagamento: null, pago: null, forma: null };
    }));
  }

  const totalReceber = receivables.reduce((s, r) => s + r.valor, 0);
  const recebido = receivables.filter((r) => r.status === "Pago").reduce((s, r) => s + r.valor, 0);
  const pendenteReceber = receivables.filter((r) => r.status === "Pendente").reduce((s, r) => s + r.valor, 0);
  const atrasadoReceber = receivables.filter((r) => r.status === "Atrasado").reduce((s, r) => s + r.valor, 0);

  const totalPagar = payables.reduce((s, p) => s + p.valor, 0);
  const pago = payables.filter((p) => p.status === "Pago").reduce((s, p) => s + p.valor, 0);
  const pendentePagar = payables.filter((p) => p.status === "Pendente").reduce((s, p) => s + p.valor, 0);

  return (
    <div>
      <PageHeader
        title="Financeiro"
        subtitle="Controle contas a receber e contas a pagar"
        action={
          tab === "receber"
            ? <PrimaryButton icon={Plus} onClick={() => setShowReceivableModal(true)}>Nova conta a receber</PrimaryButton>
            : <PrimaryButton icon={Plus} onClick={() => setShowPayableModal(true)}>Nova conta a pagar</PrimaryButton>
        }
      />

      {/* Segmented tab control */}
      <div style={{ display: "inline-flex", background: "#EEF1F8", borderRadius: 12, padding: 4, marginBottom: 20, gap: 4 }}>
        <button
          onClick={() => setTab("receber")}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 9, border: "none",
            cursor: "pointer", fontSize: 14, fontWeight: 700, background: tab === "receber" ? "#fff" : "transparent",
            color: tab === "receber" ? T.primaryDark : T.muted, boxShadow: tab === "receber" ? "0 1px 3px rgba(28,34,51,0.08)" : "none",
          }}
        >
          <ArrowDownCircle size={19} /> Contas a receber
        </button>
        <button
          onClick={() => setTab("pagar")}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 9, border: "none",
            cursor: "pointer", fontSize: 14, fontWeight: 700, background: tab === "pagar" ? "#fff" : "transparent",
            color: tab === "pagar" ? T.primaryDark : T.muted, boxShadow: tab === "pagar" ? "0 1px 3px rgba(28,34,51,0.08)" : "none",
          }}
        >
          <ArrowUpCircle size={19} /> Contas a pagar
        </button>
      </div>

      {tab === "receber" ? (
        <div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <StatCard label="Total a receber" value={`R$ ${totalReceber.toLocaleString("pt-BR")}`} delta={`${receivables.length} lançamentos`} icon={CircleDollarSign} />
            <StatCard label="Recebido no mês" value={`R$ ${recebido.toLocaleString("pt-BR")}`} delta="Pago" icon={TrendingUp} />
            <StatCard label="Pendente" value={`R$ ${pendenteReceber.toLocaleString("pt-BR")}`} delta="A vencer" deltaTone="danger" icon={Clock} />
            <StatCard label="Atrasado" value={`R$ ${atrasadoReceber.toLocaleString("pt-BR")}`} delta="Requer cobrança" deltaTone="danger" icon={TrendingDown} />
          </div>

          <Card style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", fontWeight: 700, fontSize: 15, color: T.text, borderBottom: `1px solid ${T.border}` }}>
              Mensalidades dos pacientes
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFBFE", textAlign: "left" }}>
                  {["Paciente", "Referência", "Valor", "Vencimento", "Recebimento", "Status", ""].map((h) => (
                    <th key={h} style={{ padding: "12px 20px", fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receivables.map((r) => (
                  <tr key={r.id} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: "13px 20px", fontSize: 13.5, fontWeight: 600, color: T.text }}>{r.paciente}</td>
                    <td style={{ padding: "13px 20px", fontSize: 13, color: T.muted }}>{r.referencia}</td>
                    <td style={{ padding: "13px 20px", fontSize: 13.5, fontWeight: 700, color: T.success }}>R$ {r.valor.toLocaleString("pt-BR")}</td>
                    <td style={{ padding: "13px 20px", fontSize: 13, color: T.text }}>{r.vencimento}</td>
                    <td style={{ padding: "13px 20px", fontSize: 13, color: r.recebimento ? T.text : T.muted }}>
                      {r.recebimento ? `${r.recebimento}${r.forma ? ` · ${r.forma}` : ""}` : "—"}
                    </td>
                    <td style={{ padding: "13px 20px" }}><Pill tone={statusTone(r.status)}>{r.status}</Pill></td>
                    <td style={{ padding: "13px 20px", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
                        {r.status !== "Pago" ? (
                          <button
                            onClick={() => setReceiving(r)}
                            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 8, border: "none", background: T.success, color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer", letterSpacing: 0.3 }}
                          >
                            <Banknote size={16} /> RECEBER
                          </button>
                        ) : (
                          <span style={{ display: "flex", alignItems: "center", gap: 6, color: T.success, fontWeight: 700, fontSize: 12.5 }}>
                            <Check size={16} /> RECEBIDO
                          </span>
                        )}
                        <RowMenu
                          items={r.status === "Pago"
                            ? [{ label: "Estornar recebimento", icon: Undo2, tone: "danger", onClick: () => reopenReceivable(r.id) }]
                            : [
                                { label: "Registrar recebimento", icon: Banknote, onClick: () => setReceiving(r) },
                                { label: "Cobrar no WhatsApp", icon: MessageSquare, onClick: () => {
                                    const alvo = patients.find((p) => p.name === r.paciente);
                                    setCobrandoId(alvo ? alvo.id : null);
                                  } },
                              ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <StatCard label="Total a pagar" value={`R$ ${totalPagar.toLocaleString("pt-BR")}`} delta={`${payables.length} lançamentos`} icon={CircleDollarSign} />
            <StatCard label="Pago no mês" value={`R$ ${pago.toLocaleString("pt-BR")}`} delta="Quitado" icon={TrendingUp} />
            <StatCard label="Pendente" value={`R$ ${pendentePagar.toLocaleString("pt-BR")}`} delta="A vencer" deltaTone="danger" icon={Clock} />
            <StatCard label="Saldo do mês" value={`R$ ${(recebido - pago).toLocaleString("pt-BR")}`} delta="Receber − Pagar" icon={Wallet} />
          </div>

          <Card style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", fontWeight: 700, fontSize: 15, color: T.text, borderBottom: `1px solid ${T.border}` }}>
              Despesas do consultório
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFBFE", textAlign: "left" }}>
                  {["Descrição", "Categoria", "Valor", "Vencimento", "Pagamento", "Status", ""].map((h) => (
                    <th key={h} style={{ padding: "12px 20px", fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payables.map((p) => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: "13px 20px", fontSize: 13.5, fontWeight: 600, color: T.text }}>{p.descricao}</td>
                    <td style={{ padding: "13px 20px" }}><Pill tone="muted">{p.categoria}</Pill></td>
                    <td style={{ padding: "13px 20px", fontSize: 13.5, fontWeight: 700, color: T.danger }}>R$ {p.valor.toLocaleString("pt-BR")}</td>
                    <td style={{ padding: "13px 20px", fontSize: 13, color: T.text }}>{p.vencimento}</td>
                    <td style={{ padding: "13px 20px", fontSize: 13, color: p.pagamento ? T.text : T.muted }}>
                      {p.pagamento ? `${p.pagamento}${p.forma ? ` · ${p.forma}` : ""}` : "—"}
                    </td>
                    <td style={{ padding: "13px 20px" }}><Pill tone={statusTone(p.status)}>{p.status}</Pill></td>
                    <td style={{ padding: "13px 20px", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
                        {p.status !== "Pago" ? (
                          <button
                            onClick={() => setPaying(p)}
                            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "#fff", color: T.danger, fontWeight: 700, fontSize: 12.5, cursor: "pointer", letterSpacing: 0.3 }}
                          >
                            <Banknote size={16} /> PAGAR
                          </button>
                        ) : (
                          <span style={{ display: "flex", alignItems: "center", gap: 6, color: T.success, fontWeight: 700, fontSize: 12.5 }}>
                            <Check size={16} /> PAGO
                          </span>
                        )}
                        <RowMenu
                          items={p.status === "Pago"
                            ? [{ label: "Estornar pagamento", icon: Undo2, tone: "danger", onClick: () => reopenPayable(p.id) }]
                            : [{ label: "Registrar pagamento", icon: Banknote, onClick: () => setPaying(p) }]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {showReceivableModal && (
        <NewReceivableModal
          onClose={() => setShowReceivableModal(false)}
          onSave={(entry) => {
            addReceivable(entry);
            setShowReceivableModal(false);
          }}
        />
      )}
      {showPayableModal && (
        <NewPayableModal
          onClose={() => setShowPayableModal(false)}
          onSave={(entry) => {
            setPayables((prev) => [{ id: Date.now(), ...entry }, ...prev]);
            setShowPayableModal(false);
          }}
        />
      )}

      {receiving && (
        <ReceivePaymentModal
          title={receiving.referencia}
          subtitle={receiving.paciente}
          valor={receiving.valor}
          vencimento={receiving.vencimento}
          onClose={() => setReceiving(null)}
          onConfirm={(payment) => { receiveReceivable(receiving.id, payment); setReceiving(null); }}
        />
      )}

      {paying && (
        <ReceivePaymentModal
          kind="pagar"
          title={paying.descricao}
          subtitle={paying.categoria}
          valor={paying.valor}
          vencimento={paying.vencimento}
          onClose={() => setPaying(null)}
          onConfirm={(payment) => { payPayable(paying.id, payment); setPaying(null); }}
        />
      )}

      {cobrandoId && (
        <WhatsappQuickModal
          initialPatientId={cobrandoId}
          initialTemplate="cobranca"
          onClose={() => setCobrandoId(null)}
        />
      )}
    </div>
  );
}
