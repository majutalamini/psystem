import { useState } from "react";
import { Banknote, ChevronDown, Clock, MessageSquare, Plus, TrendingUp, Undo2, X } from "lucide-react";
import NewReceivableModal from "../../../components/financeiro/NewReceivableModal";
import ReceivePaymentModal from "../../../components/financeiro/ReceivePaymentModal";
import WhatsappIcon from "../../../components/icons/WhatsappIcon";
import { Card, Pill, PrimaryButton, RowMenu, StatCard } from "../../../components/ui";
import WhatsappQuickModal from "../../../components/whatsapp/WhatsappQuickModal";
import { SITUACOES } from "../../../data/finance";
import { useAppData } from "../../../hooks/useAppData";
import { filterInputStyle, iconBtn } from "../../../styles/formStyles";
import { T, WA_GREEN } from "../../../styles/theme";
import { parseBrDate } from "../../../utils/date";

export default function FinanceiroTab({ patient }) {
  const { receivables, addReceivable, receiveReceivable, reopenReceivable } = useAppData();
  const [showModal, setShowModal] = useState(false);
  const [receiving, setReceiving] = useState(null);   // lançamento em baixa
  const [cobrando, setCobrando] = useState(false);    // cobrança via WhatsApp
  const mine = receivables.filter((r) => r.paciente === patient.name);
  const totalPago = mine.filter((r) => r.status === "Pago").reduce((s, r) => s + r.valor, 0);
  const totalAberto = mine.filter((r) => r.status !== "Pago").reduce((s, r) => s + r.valor, 0);

  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [situacaoSel, setSituacaoSel] = useState(SITUACOES.map((s) => s.key));
  const [showSituacaoMenu, setShowSituacaoMenu] = useState(false);
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
    setShowSituacaoMenu(false);
  }

  function clearFilters() {
    setDateStart(""); setDateEnd(""); setSituacaoSel(SITUACOES.map((s) => s.key));
    setApplied({ dateStart: "", dateEnd: "", situacaoSel: SITUACOES.map((s) => s.key) });
  }

  const situacaoLabel = situacaoSel.length === SITUACOES.length
    ? "Todas"
    : SITUACOES.filter((s) => situacaoSel.includes(s.key)).map((s) => s.label).join(", ") || "Nenhuma";

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard label="Total pago" value={`R$ ${totalPago.toLocaleString("pt-BR")}`} icon={TrendingUp} tone="success" />
        <StatCard label="Em aberto" value={`R$ ${totalAberto.toLocaleString("pt-BR")}`} icon={Clock} tone={totalAberto > 0 ? "danger" : "primary"} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: T.text }}>Lançamentos</span>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setCobrando(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 10, border: "none", background: WA_GREEN, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            <WhatsappIcon size={18} color="#fff" /> Cobrar no WhatsApp
          </button>
          <PrimaryButton icon={Plus} style={{ padding: "11px 16px", fontSize: 14 }} onClick={() => setShowModal(true)}>Novo lançamento</PrimaryButton>
        </div>
      </div>

      <Card style={{ padding: "16px 20px", marginBottom: 16, overflow: "visible" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 22, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Data</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, padding: "9px 0" }}>Vencimento</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Data inicial</div>
            <input value={dateStart} onChange={(e) => setDateStart(e.target.value)} placeholder="dd/mm/aaaa" style={filterInputStyle} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Data final</div>
            <input value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} placeholder="dd/mm/aaaa" style={filterInputStyle} />
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Situação</div>
            <button
              onClick={() => setShowSituacaoMenu((v) => !v)}
              style={{ ...filterInputStyle, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, cursor: "pointer", minWidth: 170 }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{situacaoLabel}</span>
              <ChevronDown size={19} color={T.muted} />
            </button>
            {showSituacaoMenu && (
              <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 6, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: "0 10px 30px rgba(20,24,38,0.14)", padding: 8, zIndex: 5, minWidth: 180 }}>
                {SITUACOES.map((s) => (
                  <label key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", fontSize: 13.5, color: T.text, cursor: "pointer" }}>
                    <input type="checkbox" checked={situacaoSel.includes(s.key)} onChange={() => toggleSituacao(s.key)} />
                    {s.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button onClick={clearFilters} style={{ ...iconBtn, background: "#fff" }} title="Limpar filtros"><X size={20} /></button>
          <button
            onClick={applyFilters}
            style={{ background: "none", border: "none", color: T.primary, fontWeight: 700, fontSize: 13, cursor: "pointer", textTransform: "uppercase", letterSpacing: 0.3, padding: "10px 0" }}
          >
            Aplicar filtros
          </button>
        </div>
      </Card>

      <Card style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFBFE", textAlign: "left" }}>
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
                      <Pill tone={situ.tone}>{situ.label}</Pill>
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
                          color: r.status === "Pago" ? "#C7CCDA" : T.primary,
                          fontWeight: 700, fontSize: 12.5, letterSpacing: 0.3,
                          cursor: r.status === "Pago" ? "default" : "pointer",
                        }}
                      >
                        RECEBER
                      </button>
                      <RowMenu
                        items={r.status === "Pago"
                          ? [{ label: "Estornar recebimento", icon: Undo2, tone: "danger", onClick: () => reopenReceivable(r.id) }]
                          : [
                              { label: "Registrar recebimento", icon: Banknote, onClick: () => setReceiving(r) },
                              { label: "Cobrar no WhatsApp", icon: MessageSquare, onClick: () => setCobrando(true) },
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
          defaultPatientName={patient.name}
          onClose={() => setShowModal(false)}
          onSave={(entry) => { addReceivable(entry); setShowModal(false); }}
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
