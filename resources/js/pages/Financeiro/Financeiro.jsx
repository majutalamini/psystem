import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Ban, Banknote, CalendarClock, Check, Edit3, Repeat, CircleDollarSign, Clock, Plus, TrendingDown, TrendingUp, Undo2, Wallet } from "lucide-react";
import EditDueDateModal from "../../components/financeiro/EditDueDateModal";
import NewReceivableModal from "../../components/financeiro/NewReceivableModal";
import ReceivePaymentModal from "../../components/financeiro/ReceivePaymentModal";
import { Card, PageHeader, Pill, PrimaryButton, RowMenu, StatCard } from "../../components/ui";
import { useAppData } from "../../hooks/useAppData";
import { T } from "../../styles/theme";
import { confirmar } from "../../utils/alertas";
import { statusTone, formatMoney } from "../../utils/format";
import NewPayableModal from "./components/NewPayableModal";

export default function Financeiro({ receivables, payables }) {
  const { addReceivable, receiveReceivable, reopenReceivable, updateReceivable, cancelReceivable, addPayable, payPayable, reopenPayable, updatePayable, cancelPayable, stopRecurrence } = useAppData();
  const [tab, setTab] = useState("receber"); // 'receber' | 'pagar'
  const [showReceivableModal, setShowReceivableModal] = useState(false);
  const [showPayableModal, setShowPayableModal] = useState(false);
  const [receiving, setReceiving] = useState(null);   // conta a receber em baixa
  const [paying, setPaying] = useState(null);         // conta a pagar em baixa
  const [editingDue, setEditingDue] = useState(null); // título a receber com vencimento em ajuste
  const [editingPayable, setEditingPayable] = useState(null); // conta a pagar em edição

  async function cancelarTitulo(r) {
    const ok = await confirmar({
      titulo: "Cancelar este título?",
      texto: `"${r.referencia}" (R$ ${formatMoney(r.valor)}) sai do financeiro${r.paciente ? ` de ${r.paciente}` : ""}. Essa ação não pode ser desfeita.`,
      confirmar: "Cancelar título",
      perigo: true,
    });
    if (ok) cancelReceivable(r.id);
  }

  async function cancelarConta(p) {
    const ok = await confirmar({
      titulo: "Cancelar esta conta a pagar?",
      texto: `"${p.descricao}" (R$ ${formatMoney(p.valor)}) sai do financeiro e dos relatórios.${p.recorrenciaAtiva ? " As próximas contas da recorrência continuam sendo geradas; para parar, use Encerrar recorrência." : ""}`,
      confirmar: "Cancelar conta",
      perigo: true,
    });
    if (ok) cancelPayable(p.id);
  }

  async function encerrarRecorrencia(p) {
    const ok = await confirmar({
      titulo: "Encerrar a recorrência?",
      texto: `"${p.descricao}" não será mais lançada nos próximos meses. As contas já lançadas continuam.`,
      confirmar: "Encerrar recorrência",
      perigo: true,
    });
    if (ok) stopRecurrence(p.id);
  }

  const totalReceber = receivables.reduce((s, r) => s + r.valor, 0);
  // Cobranças podem ser recebidas em partes: somam o que entrou (recebido) e o que falta (saldo).
  const recebido = receivables.reduce((s, r) => s + (r.recebido || 0), 0);
  const pendenteReceber = receivables.filter((r) => r.status === "Pendente").reduce((s, r) => s + r.saldo, 0);
  const atrasadoReceber = receivables.filter((r) => r.status === "Atrasado").reduce((s, r) => s + r.saldo, 0);

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
      <div style={{ display: "inline-flex", background: T.mutedBg, borderRadius: 12, padding: 4, marginBottom: 20, gap: 4 }}>
        <button
          onClick={() => setTab("receber")}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 9, border: "none",
            cursor: "pointer", fontSize: 14, fontWeight: 700, background: tab === "receber" ? T.surface : "transparent",
            color: tab === "receber" ? T.primaryDark : T.muted, boxShadow: tab === "receber" ? "0 1px 3px rgba(28,34,51,0.08)" : "none",
          }}
        >
          <ArrowDownCircle size={19} /> Contas a receber
        </button>
        <button
          onClick={() => setTab("pagar")}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 9, border: "none",
            cursor: "pointer", fontSize: 14, fontWeight: 700, background: tab === "pagar" ? T.surface : "transparent",
            color: tab === "pagar" ? T.primaryDark : T.muted, boxShadow: tab === "pagar" ? "0 1px 3px rgba(28,34,51,0.08)" : "none",
          }}
        >
          <ArrowUpCircle size={19} /> Contas a pagar
        </button>
      </div>

      {tab === "receber" ? (
        <div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <StatCard label="Total a receber" value={`R$ ${formatMoney(totalReceber)}`} delta={`${receivables.length} lançamentos`} icon={CircleDollarSign} />
            <StatCard label="Recebido no mês" value={`R$ ${formatMoney(recebido)}`} delta="Pago" icon={TrendingUp} />
            <StatCard label="Pendente" value={`R$ ${formatMoney(pendenteReceber)}`} delta="A vencer" deltaTone="danger" icon={Clock} />
            <StatCard label="Atrasado" value={`R$ ${formatMoney(atrasadoReceber)}`} delta="Requer cobrança" deltaTone="danger" icon={TrendingDown} />
          </div>

          <Card style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", fontWeight: 700, fontSize: 15, color: T.text, borderBottom: `1px solid ${T.border}` }}>
              Sessões dos pacientes
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.surfaceAlt, textAlign: "left" }}>
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
                    <td style={{ padding: "13px 20px", fontSize: 13.5, fontWeight: 700, color: T.success }}>R$ {formatMoney(r.valor)}</td>
                    <td style={{ padding: "13px 20px", fontSize: 13, color: T.text }}>{r.vencimento}</td>
                    <td style={{ padding: "13px 20px", fontSize: 13, color: r.recebimento ? T.text : T.muted }}>
                      {r.recebimento ? `${r.recebimento}${r.forma ? ` · ${r.forma}` : ""}` : "—"}
                      {r.status !== "Pago" && r.recebido != null && (
                        <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                          R$ {formatMoney(r.recebido)} recebido · falta R$ {formatMoney(r.saldo)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      <Pill tone={statusTone(r.status)}>{r.status}{r.status !== "Pago" && r.recebido != null ? " · em parte" : ""}</Pill>
                    </td>
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
                          items={[
                            ...(r.status !== "Pago" ? [
                              { label: "Registrar recebimento", icon: Banknote, onClick: () => setReceiving(r) },
                            ] : []),
                            ...(r.status !== "Pago" ? [
                              { label: "Alterar vencimento", icon: CalendarClock, onClick: () => setEditingDue(r) },
                            ] : []),
                            ...(r.status !== "Pago" && r.recebido == null ? [
                              { label: "Cancelar título", icon: Ban, tone: "danger", onClick: () => cancelarTitulo(r) },
                            ] : []),
                            ...(r.recebido != null ? [
                              { label: "Estornar último recebimento", icon: Undo2, tone: "danger", onClick: () => reopenReceivable(r.id) },
                            ] : []),
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
            <StatCard label="Total a pagar" value={`R$ ${formatMoney(totalPagar)}`} delta={`${payables.length} lançamentos`} icon={CircleDollarSign} />
            <StatCard label="Pago no mês" value={`R$ ${formatMoney(pago)}`} delta="Quitado" icon={TrendingUp} />
            <StatCard label="Pendente" value={`R$ ${formatMoney(pendentePagar)}`} delta="A vencer" deltaTone="danger" icon={Clock} />
            <StatCard label="Saldo do mês" value={`R$ ${formatMoney(recebido - pago)}`} delta="Receber − Pagar" icon={Wallet} />
          </div>

          <Card style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", fontWeight: 700, fontSize: 15, color: T.text, borderBottom: `1px solid ${T.border}` }}>
              Despesas do consultório
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.surfaceAlt, textAlign: "left" }}>
                  {["Descrição", "Categoria", "Valor", "Vencimento", "Pagamento", "Status", ""].map((h) => (
                    <th key={h} style={{ padding: "12px 20px", fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payables.map((p) => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: "13px 20px", fontSize: 13.5, fontWeight: 600, color: T.text }}>
                      {p.descricao}
                      {p.recorrente && (
                        <span title={p.recorrenciaAtiva ? "Conta recorrente: lançada todo mês" : "Recorrência encerrada"} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 8, fontSize: 11.5, fontWeight: 700, color: p.recorrenciaAtiva ? T.primary : T.muted }}>
                          <Repeat size={13} /> {p.recorrenciaAtiva ? "Mensal" : "Encerrada"}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "13px 20px" }}><Pill tone="muted">{p.categoria}</Pill></td>
                    <td style={{ padding: "13px 20px", fontSize: 13.5, fontWeight: 700, color: T.danger }}>R$ {formatMoney(p.valor)}</td>
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
                            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.danger, fontWeight: 700, fontSize: 12.5, cursor: "pointer", letterSpacing: 0.3 }}
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
                            : [
                              { label: "Registrar pagamento", icon: Banknote, onClick: () => setPaying(p) },
                              { label: "Editar conta", icon: Edit3, onClick: () => setEditingPayable(p) },
                              ...(p.recorrenciaAtiva ? [{ label: "Encerrar recorrência", icon: Repeat, onClick: () => encerrarRecorrencia(p) }] : []),
                              { label: "Cancelar conta", icon: Ban, tone: "danger", onClick: () => cancelarConta(p) },
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
      )}

      {showReceivableModal && (
        <NewReceivableModal
          onClose={() => setShowReceivableModal(false)}
          onSave={(entry) => addReceivable(entry, { onSuccess: () => setShowReceivableModal(false) })}
        />
      )}

      {editingDue && (
        <EditDueDateModal
          titulo={editingDue.referencia}
          subtitulo={editingDue.paciente}
          vencimento={editingDue.vencimento}
          onClose={() => setEditingDue(null)}
          onSave={(vencimento) => updateReceivable(editingDue.id, { vencimento }, { onSuccess: () => setEditingDue(null) })}
        />
      )}
      {editingPayable && (
        <NewPayableModal
          payable={editingPayable}
          onClose={() => setEditingPayable(null)}
          onSave={(entry) => updatePayable(editingPayable.id, entry, { onSuccess: () => setEditingPayable(null) })}
        />
      )}
      {showPayableModal && (
        <NewPayableModal
          onClose={() => setShowPayableModal(false)}
          onSave={(entry) => addPayable(entry, { onSuccess: () => setShowPayableModal(false) })}
        />
      )}

      {receiving && (
        <ReceivePaymentModal
          title={receiving.referencia}
          subtitle={receiving.paciente}
          valor={receiving.valor}
          saldo={receiving.saldo}
          vencimento={receiving.vencimento}
          onClose={() => setReceiving(null)}
          onConfirm={(payment) => receiveReceivable(receiving.id, payment, { onSuccess: () => setReceiving(null) })}
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
          onConfirm={(payment) => payPayable(paying.id, payment, { onSuccess: () => setPaying(null) })}
        />
      )}

    </div>
  );
}
