import { useState } from "react";
import { Banknote, Clock, MessageSquare, Plus, SlidersHorizontal, TrendingUp, Undo2, X } from "lucide-react";
import NewReceivableModal from "../../../components/financeiro/NewReceivableModal";
import ReceivePaymentModal from "../../../components/financeiro/ReceivePaymentModal";
import WhatsappIcon from "../../../components/icons/WhatsappIcon";
import { Card, Pill, PrimaryButton, RowMenu, StatCard } from "../../../components/ui";
import WhatsappQuickModal from "../../../components/whatsapp/WhatsappQuickModal";
import { SITUACOES } from "../../../data/finance";
import { useAppData } from "../../../hooks/useAppData";
import { filterInputStyle } from "../../../styles/formStyles";
import { T, WA_GREEN } from "../../../styles/theme";
import { parseBrDate } from "../../../utils/date";
import { maskDate } from "../../../utils/format";

export default function FinanceiroTab({ patient, receivables }) {
  const { addReceivable, receiveReceivable, reopenReceivable } = useAppData();
  const [showModal, setShowModal] = useState(false);
  const [receiving, setReceiving] = useState(null);   // lançamento em baixa
  const [cobrando, setCobrando] = useState(false);    // cobrança via WhatsApp
  const mine = receivables;
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
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <button
          onClick={() => setCobrando(true)}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 26px", borderRadius: 12, border: "none", background: WA_GREEN, color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 12px rgba(31,174,110,0.25)" }}
        >
          <WhatsappIcon size={24} color="#fff" /> Cobrar no WhatsApp
        </button>
        <PrimaryButton icon={Plus} style={{ padding: "15px 26px", fontSize: 16, borderRadius: 12 }} onClick={() => setShowModal(true)}>Novo lançamento</PrimaryButton>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard label="Total pago" value={`R$ ${totalPago.toLocaleString("pt-BR")}`} icon={TrendingUp} tone="success" />
        <StatCard label="Em aberto" value={`R$ ${totalAberto.toLocaleString("pt-BR")}`} icon={Clock} tone={totalAberto > 0 ? "danger" : "primary"} />
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: T.text }}>Lançamentos</span>
      </div>

      <Card style={{ padding: "18px 22px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: T.text }}>
            <SlidersHorizontal size={20} color={T.primary} /> Filtrar
          </span>
          <input value={dateStart} onChange={(e) => setDateStart(maskDate(e.target.value))} onKeyDown={(e) => e.key === "Enter" && applyFilters()} placeholder="Vencimento de" inputMode="numeric" title="Vencimento a partir de (dd/mm/aaaa)" style={{ ...filterInputStyle, minWidth: 0, width: 170, fontSize: 14.5, padding: "12px 14px", border: `1px solid ${T.muted}` }} />
          <input value={dateEnd} onChange={(e) => setDateEnd(maskDate(e.target.value))} onKeyDown={(e) => e.key === "Enter" && applyFilters()} placeholder="até" inputMode="numeric" title="Vencimento até (dd/mm/aaaa)" style={{ ...filterInputStyle, minWidth: 0, width: 130, fontSize: 14.5, padding: "12px 14px", border: `1px solid ${T.muted}` }} />
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
                  <td style={{ padding: "14px 20px", fontSize: 13.5, color: T.text, fontWeight: 600 }}>R$ {r.valor.toLocaleString("pt-BR")}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13.5, color: r.recebido != null ? T.success : T.muted, fontWeight: 600 }}>
                    {r.recebido != null ? `R$ ${r.recebido.toLocaleString("pt-BR")}` : "—"}
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
                            { label: "Cobrar no WhatsApp", icon: MessageSquare, onClick: () => setCobrando(true) },
                          ] : []),
                          ...(r.recebido != null ? [
                            { label: "Estornar último recebimento", icon: Undo2, tone: "danger", onClick: () => reopenReceivable(r.id) },
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

      {cobrando && (
        <WhatsappQuickModal
          initialPatientId={patient.id}
          initialTemplate="cobranca"
          onClose={() => setCobrando(false)}
        />
      )}
    </div>
  );
}
