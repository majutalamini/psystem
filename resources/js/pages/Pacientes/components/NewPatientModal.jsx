import { useState } from "react";
import { Check } from "lucide-react";
import { FormField, FormSectionTitle, Modal, PrimaryButton } from "../../../components/ui";
import { CONVENIO_OPTIONS, SEXO_OPTIONS } from "../../../data/patients";
import { useAppData } from "../../../hooks/useAppData";
import { T } from "../../../styles/theme";

const BLANK = {
  name: "", nascimento: "", cpf: "", sexo: "", phone: "", email: "", endereco: "", cidade: "", uf: "",
  convenio: "Particular", emergenciaNome: "", emergenciaTelefone: "", observacoes: "", status: "Ativo",
};

/* O Laravel valida e devolve os erros por campo; o modal fecha quando o salvamento dá certo. */
export default function NewPatientModal({ onClose, onSave, editingPatient }) {
  const { errors = {} } = useAppData();
  const [form, setForm] = useState(() => (editingPatient ? { ...BLANK, ...editingPatient } : BLANK));

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));
  const field = (key) => ({ value: form[key], onChange: set(key), error: errors[key] });

  return (
    <Modal title={editingPatient ? "Editar cadastro do paciente" : "Cadastro de paciente"} onClose={onClose} width={640}>
      <FormSectionTitle first>Dados pessoais</FormSectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Nome completo *" {...field("name")} placeholder="Nome do paciente" />
        <FormField label="Data de nascimento *" {...field("nascimento")} placeholder="dd/mm/aaaa" />
        <FormField label="CPF *" {...field("cpf")} placeholder="000.000.000-00" />
        <FormField label="Sexo" {...field("sexo")} options={SEXO_OPTIONS} />
        <FormField label="Convênio" {...field("convenio")} options={CONVENIO_OPTIONS} />
        <FormField label="Status" {...field("status")} options={["Ativo", "Inativo"]} />
      </div>

      <FormSectionTitle>Contato</FormSectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Telefone *" {...field("phone")} placeholder="(00) 00000-0000" />
        <FormField label="E-mail" {...field("email")} type="email" placeholder="paciente@email.com" />
      </div>
      <FormField label="Endereço" {...field("endereco")} placeholder="Rua, número — bairro" />
      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "0 16px" }}>
        <FormField label="Cidade" {...field("cidade")} />
        <FormField label="UF" {...field("uf")} placeholder="SC" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Contato de emergência" {...field("emergenciaNome")} placeholder="Nome (parentesco)" />
        <FormField label="Telefone de emergência" {...field("emergenciaTelefone")} placeholder="(00) 00000-0000" />
      </div>

      <FormField label="Observações" {...field("observacoes")} textarea placeholder="Informações adicionais relevantes" />

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Check} onClick={() => onSave(form)}>
          {editingPatient ? "Salvar alterações" : "Cadastrar paciente"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
