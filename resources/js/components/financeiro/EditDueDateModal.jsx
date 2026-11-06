import { useState } from "react";
import { useAppData } from "../../hooks/useAppData";
import { inputStyle } from "../../styles/formStyles";
import { T } from "../../styles/theme";
import { ErrorText, Modal, PrimaryButton } from "../ui";
import DateInput from "../ui/DateInput";

/* Troca só a data de vencimento de um título em aberto. */
export default function EditDueDateModal({ titulo, subtitulo, vencimento, onClose, onSave }) {
  const { errors = {} } = useAppData();
  const [data, setData] = useState(vencimento);

  return (
    <Modal title="Alterar vencimento" onClose={onClose} width={380}>
      <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>{titulo}</div>
      {subtitulo && <div style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>{subtitulo}</div>}
      {!subtitulo && <div style={{ marginBottom: 14 }} />}

      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Novo vencimento</label>
      <DateInput value={data} onChange={setData} style={errors.vencimento ? { ...inputStyle, borderColor: T.danger, marginBottom: 4 } : inputStyle} />
      <ErrorText>{errors.vencimento}</ErrorText>

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={() => onSave(data)}>Salvar</PrimaryButton>
      </div>
    </Modal>
  );
}
