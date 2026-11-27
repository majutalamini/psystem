import { useState } from "react";
import { Check } from "lucide-react";
import { FormField, Modal, PrimaryButton } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { T } from "../../../styles/theme";
import { isValidCpf, maskCpf, maskPhone, onlyDigits } from "../../../utils/format";

const BLANK = { name: "", cpf: "", phone: "", email: "", endereco: "", observacoes: "" };

/* Cadastro/edição do responsável. Usado na tela de responsáveis e, na hora, dentro do cadastro do paciente. */
export default function GuardianModal({ editing, onClose, onSaved }) {
  const { errors: todosErros = {}, addGuardian, updateGuardian } = useAppData();
  const errors = todosErros.responsavel || {};
  const [form, setForm] = useState(() => (editing ? { ...BLANK, ...editing, cpf: editing.cpf || "", email: editing.email || "" } : BLANK));
  const [salvando, setSalvando] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));
  const field = (key) => ({ value: form[key], onChange: set(key), error: errors[key] });
  const cpfInvalido = onlyDigits(form.cpf).length === 11 && !isValidCpf(form.cpf);

  function salvar() {
    if (cpfInvalido) return;
    setSalvando(true);
    const opts = {
      onSuccess: (page) => { onSaved?.(page.props.flash?.novoResponsavel); onClose(); },
      onFinish: () => setSalvando(false),
    };
    if (editing) updateGuardian(editing.id, form, opts);
    else addGuardian(form, opts);
  }

  return (
    <Modal title={editing ? "Editar responsável" : "Novo responsável"} onClose={onClose} width={560}>
      <FormField label="Nome completo *" {...field("name")} placeholder="Nome do responsável" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <FormField label="CPF" {...field("cpf")} onChange={(v) => set("cpf")(maskCpf(v))} placeholder="000.000.000-00" error={errors.cpf || (cpfInvalido ? "CPF inválido." : undefined)} />
        <FormField label="Telefone *" {...field("phone")} onChange={(v) => set("phone")(maskPhone(v))} placeholder="(00) 00000-0000" />
      </div>
      <FormField label="E-mail" {...field("email")} type="email" placeholder="responsavel@email.com" />
      <FormField label="Endereço" {...field("endereco")} placeholder="Rua, número — bairro" />
      <FormField label="Observações" {...field("observacoes")} textarea minHeight={70} />

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Check} onClick={salvar} disabled={salvando}>
          {editing ? "Salvar alterações" : "Cadastrar responsável"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
