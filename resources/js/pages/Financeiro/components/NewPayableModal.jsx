import { useState } from "react";
import { ErrorText, Modal, MoneyInput, PrimaryButton } from "../../../components/ui";
import { PAYABLE_CATEGORIES } from "../../../data/finance";
import { useAppData } from "../../../hooks/useAppData";
import { inputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";
import { todayLabel } from "../../../utils/date";
import DateInput from "../../../components/ui/DateInput";

const checkStyle = { display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13.5, color: T.text, cursor: "pointer", margin: "2px 0 14px", lineHeight: 1.4 };

/* Nova conta ou edição (`payable` preenchido). A conta nasce em aberto; a baixa é feita pelo botão Pagar.
   "Repetir todo mês" cria a conta recorrente: a data informada define o dia do mês das próximas. */
export default function NewPayableModal({ onClose, onSave, payable }) {
  const { errors = {} } = useAppData();
  const editando = Boolean(payable);
  const [form, setForm] = useState(() => (editando
    ? { descricao: payable.descricao, categoria: payable.categoria, valor: payable.valor, vencimento: payable.vencimento, aplicarFuturos: false }
    : { descricao: "", categoria: "Estrutura", valor: "", vencimento: todayLabel(), recorrente: false }));
  const errorStyle = (key) => (errors[key] ? { ...inputStyle, borderColor: T.danger, marginBottom: 4 } : inputStyle);
  const dia = parseInt(String(form.vencimento).slice(0, 2), 10);

  return (
    <Modal title={editando ? "Editar conta a pagar" : "Nova conta a pagar"} onClose={onClose} width={400}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Descrição</label>
      <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Internet do consultório" style={errorStyle("descricao")} />
      <ErrorText>{errors.descricao}</ErrorText>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Categoria</label>
      <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} style={inputStyle}>
        {[...new Set([form.categoria, ...PAYABLE_CATEGORIES])].map((c) => <option key={c}>{c}</option>)}
      </select>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Valor (R$)</label>
      <MoneyInput value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} style={errorStyle("valor")} />
      <ErrorText>{errors.valor}</ErrorText>

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Vencimento</label>
      <DateInput value={form.vencimento} onChange={(v) => setForm({ ...form, vencimento: v })} style={errorStyle("vencimento")} />
      <ErrorText>{errors.vencimento}</ErrorText>

      {!editando && (
        <label style={checkStyle}>
          <input type="checkbox" checked={form.recorrente} onChange={(e) => setForm({ ...form, recorrente: e.target.checked })} style={{ marginTop: 3 }} />
          <span>
            <strong>Repetir todo mês</strong>
            <span style={{ display: "block", fontSize: 12.5, color: T.muted }}>
              {Number.isNaN(dia) ? "A conta é lançada no começo de cada mês, vencendo no mesmo dia." : `A conta é lançada no começo de cada mês, vencendo todo dia ${dia}.`}
            </span>
          </span>
        </label>
      )}
      {editando && payable.recorrenciaAtiva && (
        <label style={checkStyle}>
          <input type="checkbox" checked={form.aplicarFuturos} onChange={(e) => setForm({ ...form, aplicarFuturos: e.target.checked })} style={{ marginTop: 3 }} />
          <span>
            <strong>Aplicar também aos próximos meses</strong>
            <span style={{ display: "block", fontSize: 12.5, color: T.muted }}>Sem marcar, só esta conta muda.</span>
          </span>
        </label>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={() => onSave(form)}>{editando ? "Salvar" : "Adicionar"}</PrimaryButton>
      </div>
    </Modal>
  );
}
