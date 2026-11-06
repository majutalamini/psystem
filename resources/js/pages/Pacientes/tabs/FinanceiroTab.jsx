import { useState } from "react";
import { Banknote, Clock, History, Plus, SlidersHorizontal, TrendingUp, X, XCircle, Ban, CalendarClock } from "lucide-react";
import EditDueDateModal from "../../../components/financeiro/EditDueDateModal";
import NewReceivableModal from "../../../components/financeiro/NewReceivableModal";
import PaymentsModal from "../../../components/financeiro/PaymentsModal";
import ReceivePaymentModal from "../../../components/financeiro/ReceivePaymentModal";
import { Card, Pill, PrimaryButton, RowMenu, StatCard } from "../../../components/ui";
import { SITUACOES } from "../../../data/finance";
import { useAppData } from "../../../hooks/useAppData";
import { filterInputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import DateInput from "../../../components/ui/DateInput";
import { confirmar } from "../../../utils/alertas";
import { parseBrDate } from "../../../utils/date";
import { inputStyle } from "../../../styles/formStyles";
import { maskDate, formatMoney } from "../../../utils/format";

export default function FinanceiroTab({ patient, receivables }) {
  const { addReceivable, receiveReceivable, reverseReceivablePayment, cancelReceivable, updateReceivable, setDiaVencimento } = useAppData();
  async function cancelar(r) {
    const ok = await confirmar({
      titulo: "Cancelar este lançamento?",
      texto: `"${r.referencia}" (R$ ${formatMoney(r.valor)}, vence ${r.vencimento}) sai do financeiro. Essa ação não pode ser desfeita.`,
      confirmar: "Cancelar lançamento",
      perigo: true,
    });
    if (ok) cancelReceivable(r.id);
  }

  const [showModal, setShowModal] = useState(false);
  const [receiving, setReceiving] = useState(null);   // lançamento em baixa
  const [historicoId, setHistoricoId] = useState(null); // pagamentos de um lançamento
  const [editingDue, setEditingDue] = useState(null); // título com vencimento em ajuste

  async function cancelarTitulo(r) {
    const ok = await confirmar({
      titulo: "Cancelar este título?",
      texto: `"${r.referencia}" (R$ ${formatMoney(r.valor)}) sai do financeiro${r.paciente ? ` de ${r.paciente}` : ""}. Essa ação não pode ser desfeita.`,
      confirmar: "Cancelar título",
      perigo: true,
    });
    if (ok) cancelReceivable(r.id);
  }
  const mine = receivables;
  const historico = historicoId && mine.find((r) => r.id === historicoId);
  const totalPago = mine.reduce((s, r) => s + (r.recebido || 0), 0);
  const totalAberto = mine.reduce((s, r) => s + r.saldo, 0);

  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [situacaoSel, setSituacaoSel] = useState(SITUACOES.map((s) => s.key));
  const [applied, setApplied] = useState({ dateStart: "", dateEnd: "", situacaoSel: SITUACOES.map((s) => s.key) });

  const filtered = mine.filter((r) => {
    if (!applied.situacaoSel.includes(r.status)) return false;
    const venc = parseBrDate(r.vencimento);
    const start = applied.dateStart ? parseBrDate(applied.dateStart) : null;
    const end = applied.dateEnd ? parseBrDate(applied.dateEnd) : null;
    if (start && venc && venc < start) return false;
    if (end && venc && venc > end) return false;
    return true;
  });

  function toggleSituacao(key) {
    setSituacaoSel((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function applyFilters() {
    setApplied({ dateStart, dateEnd, situacaoSel });
  }

  function clearFilters() {
    setDateStart(""); setDateEnd(""); setSituacaoSel(SITUACOES.map((s) => s.key));
    setApplied({ dateStart: "", dateEnd: "", situacaoSel: SITUACOES.map((s) => s.key) });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <label htmlFor="dia-mensalidade" style={{ fontSize: 13.5, fontWeight: 600, color: T.muted }}>A mensalidade da matrícula vence todo</label>
          <select
            id="dia-mensalidade"
            value={patient.diaVencimento || 10}
            onChange={(e) => setDiaVencimento(patient.id, Number(e.target.value))}
            style={{ ...inputStyle, width: 110, marginBottom: 0 }}
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Dia {d}</option>)}
          </select>
          <span style={{ fontSize: 12.5, color: T.muted }}>Vale para o título em aberto e para os próximos.</span>
        </div>
        <PrimaryButton icon={Plus} style={{ padding: "15px 26px", fontSize: 16, borderRadius: 12 }} onClick={() => setShowModal(true)}>Novo lançamento</PrimaryButton>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard label="Total pago" value={`R$ ${formatMoney(totalPago)}`} icon={TrendingUp} tone="success" />
        <StatCard label="Em aberto" value={`R$ ${formatMoney(totalAberto)}`} icon={Clock} tone={totalAberto > 0 ? "danger" : "primary"} />
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: T.text }}>Lançamentos</span>
      </div>

      <Card style={{ padding: "18px 22px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: T.text }}>
            <SlidersHorizontal size={20} color={T.primary} /> Filtrar
          </span>
          <DateInput value={dateStart} onChange={setDateStart} onKeyDown={(e) => e.key === "Enter" && applyFilters()} placeholder="Vencimento de" title="Vencimento a partir de (dd/mm/aaaa)" style={{ ...filterInputStyle, minWidth: 0, width: 170, fontSize: 14.5, padding: "12px 14px", border: `1px solid ${T.muted}` }} />
          <DateInput value={dateEnd} onChange={setDateEnd} onKeyDown={(e) => e.key === "Enter" && applyFilters()} placeholder="até" title="Vencimento até (dd/mm/aaaa)" style={{ ...filterInputStyle, minWidth: 0, width: 130, fontSize: 14.5, padding: "12px 14px", border: `1px solid ${T.muted}` }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SITUACOES.map((s) => {
              const on = situacaoSel.includes(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleSituacao(s.key)}
                  style={{
                    padding: "10px 18px", borderRadius: 999, cursor: "pointer", fontSize: 14.5, fontWeight: 600,
                    border: `1px solid ${on ? T.primary : T.border}`, background: on ? T.primaryTint : T.surface, color: on ? T.primaryDark : T.muted,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <button onClick={applyFilters} style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: T.primary, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer", boxShadow: "0 4px 10px rgba(76,111,255,0.25)" }}>
            Aplicar
          </button>
          <button onClick={clearFilters} title="Limpar filtros" style={{ display: "flex", alignItems: "center", gap: 5, padding: "12px 10px", border: "none", background: "none", color: T.muted, fontWeight: 600, fontSize: 14.5, cursor: "pointer" }}>
            <X size={17} /> Limpar
          </button>
        </div>
      </Card>

      <Card style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: T.surfaceAlt, textAlign: "left" }}>
              {["Descrição", "Vencimento", "Recebimento", "Valor", "Recebido", "Situação", ""].map((h) => (
                <th key={h} style={{ padding: "12px 20px", fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 24, fontSize: 13.5, color: T.muted }}>Nenhum lançamento encontrado para os filtros selecionados.</td></tr>
            ) : filtered.map((r, i) => {
              const situ = SITUACOES.find((s) => s.key === r.status) || SITUACOES[0];
              return (
                <tr key={r.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
                  <td style={{ padding: "14px 20px", fontSize: 13.5, color: T.text, fontWeight: 600 }}>{r.referencia}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13.5, color: T.text }}>{r.vencimento}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13.5, color: T.text }}>{r.recebimento || "—"}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13.5, color: T.text, fontWeight: 600 }}>R$ {formatMoney(r.valor)}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13.5, color: r.recebido != null ? T.success : T.muted, fontWeight: 600 }}>
                    {r.recebido != null ? `R$ ${formatMoney(r.recebido)}` : "—"}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    {r.status === "Pago" ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: T.success, color: "#fff", borderRadius: 8, padding: "9px 14px", fontSize: 13.5, fontWeight: 700 }}>
                        Recebido
                      </div>
                    ) : (
                      <Pill tone={situ.tone}>{situ.label}{r.recebido != null ? " · em parte" : ""}</Pill>
                    )}
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16 }}>
                      <button
                        onClick={() => r.status !== "Pago" && setReceiving(r)}
                        disabled={r.status === "Pago"}
                        style={{
                          background: "none", border: `1px solid ${r.status === "Pago" ? "transparent" : T.border}`,
                          borderRadius: 8, padding: "8px 14px",
                          color: r.status === "Pago" ? T.faint : T.primary,
                          fontWeight: 700, fontSize: 12.5, letterSpacing: 0.3,
                          cursor: r.status === "Pago" ? "default" : "pointer",
                        }}
                      >
                        RECEBER
                      </button>
                      <RowMenu
                        items={[
                          ...(r.status !== "Pago" ? [
                            { label: "Registrar recebimento", icon: Banknote, onClick: () => setReceiving(r) },
                          ] : []),
                          ...(r.pagamentos?.length ? [
                            { label: "Pagamentos e estornos", icon: History, onClick: () => setHistoricoId(r.id) },
                          ] : []),
                          ...(r.status !== "Pago" ? [{ label: "Alterar vencimento", icon: CalendarClock, onClick: () => setEditingDue(r) }] : []),
                          ...(r.recebido == null && r.status !== "Pago" ? [
                            { label: "Cancelar lançamento", icon: XCircle, tone: "danger", onClick: () => cancelar(r) },

                          ] : []),
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <NewReceivableModal
          patientId={patient.id}
          onClose={() => setShowModal(false)}
          onSave={(entry) => addReceivable(entry, { onSuccess: () => setShowModal(false) })}
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

      {historico && (
        <PaymentsModal
          title={historico.referencia}
          subtitle={historico.paciente}
          pagamentos={historico.pagamentos}
          onClose={() => setHistoricoId(null)}
          onReverse={(pagamentoId, motivo) => reverseReceivablePayment(historico.id, pagamentoId, motivo)}
        />
      )}

    </div>
  );
}
