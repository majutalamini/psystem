import { useState } from "react";
import { Check, Plus, UserRoundCheck } from "lucide-react";
import { FormField, FormSectionTitle, Modal, PrimaryButton } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { T } from "../../../styles/theme";
import { ageFromBrDate } from "../../../utils/date";
import { isValidBrDate, isValidCpf, maskCpf, maskDate, maskPhone, onlyDigits } from "../../../utils/format";
import GuardianModal from "../../Responsaveis/components/GuardianModal";

const PARENTESCOS = ["", "Mãe", "Pai", "Avó", "Avô", "Tia", "Tio", "Irmã", "Irmão", "Tutor(a) legal", "Outro"];

const BLANK = {
  name: "", nascimento: "", cpf: "", sexo: "", phone: "", email: "", endereco: "", cidade: "", uf: "",
  emergenciaNome: "", emergenciaTelefone: "", observacoes: "", status: "Ativo", responsavelId: "", parentesco: "",
};

/* O Laravel valida e devolve os erros por campo; o modal fecha quando o salvamento dá certo. */
export default function NewPatientModal({ onClose, onSave, editingPatient }) {
  const { errors = {}, guardianOptions = [] } = useAppData();
  const [form, setForm] = useState(() => (editingPatient
    ? { ...BLANK, ...editingPatient, responsavelId: editingPatient.responsavelId ?? "", parentesco: editingPatient.parentesco ?? "" }
    : BLANK));
  const [novoResponsavel, setNovoResponsavel] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));
  const field = (key) => ({ value: form[key], onChange: set(key), error: errors[key] });

  const cpfInvalido = onlyDigits(form.cpf).length === 11 && !isValidCpf(form.cpf);
  const nascInvalido = form.nascimento.length === 10 && !isValidBrDate(form.nascimento);
  const idade = form.nascimento.length === 10 && !nascInvalido ? ageFromBrDate(form.nascimento) : null;
  const menor = idade != null && idade < 18;
  const faltaResponsavel = menor && !form.responsavelId;

  return (
    <Modal title={editingPatient ? "Editar cadastro do paciente" : "Cadastro de paciente"} onClose={onClose} width={640}>
      <FormSectionTitle first>Dados pessoais</FormSectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Nome completo *" {...field("name")} placeholder="Nome do paciente" />
        <FormField label="Data de nascimento *" {...field("nascimento")} onChange={(v) => set("nascimento")(maskDate(v))} placeholder="dd/mm/aaaa" error={errors.nascimento || (nascInvalido ? "Data inválida ou no futuro." : undefined)} />
        <FormField label="CPF *" {...field("cpf")} onChange={(v) => set("cpf")(maskCpf(v))} placeholder="000.000.000-00" error={errors.cpf || (cpfInvalido ? "CPF inválido." : undefined)} />
      </div>

      <FormSectionTitle>Contato</FormSectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Telefone *" {...field("phone")} onChange={(v) => set("phone")(maskPhone(v))} placeholder="(00) 00000-0000" />
        <FormField label="E-mail" {...field("email")} type="email" placeholder="paciente@email.com" />
      </div>
      <FormField label="Endereço" {...field("endereco")} placeholder="Rua, número — bairro" />
      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "0 16px" }}>
        <FormField label="Cidade" {...field("cidade")} />
        <FormField label="UF" {...field("uf")} onChange={(v) => set("uf")(v.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase())} placeholder="SC" maxLength={2} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Contato de emergência" {...field("emergenciaNome")} placeholder="Nome (parentesco)" />
        <FormField label="Telefone de emergência" {...field("emergenciaTelefone")} onChange={(v) => set("emergenciaTelefone")(maskPhone(v))} placeholder="(00) 00000-0000" />
      </div>

      <FormSectionTitle>Responsável{menor ? " *" : ""}</FormSectionTitle>
      {menor && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.warnText, background: T.warnTint, borderRadius: 10, padding: "9px 12px", marginBottom: 12 }}>
          <UserRoundCheck size={16} /> Paciente menor de idade ({idade} anos): é obrigatório ter um responsável.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0 16px", alignItems: "start" }}>
        <FormField
          label={`Responsável${menor ? " *" : ""}`}
          value={form.responsavelId}
          onChange={(v) => set("responsavelId")(v ? Number(v) : "")}
          options={[{ value: "", label: menor ? "Selecione o responsável" : "Sem responsável" }, ...guardianOptions.map((g) => ({ value: g.id, label: g.name }))]}
          error={errors.responsavelId}
        />
        <FormField label="Parentesco" {...field("parentesco")} options={PARENTESCOS.map((p) => ({ value: p, label: p || "—" }))} />
      </div>
      <button
        type="button"
        onClick={() => setNovoResponsavel(true)}
        style={{ display: "flex", alignItems: "center", gap: 6, marginTop: -6, marginBottom: 6, padding: 0, border: "none", background: "none", color: T.primary, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}
      >
        <Plus size={16} /> Cadastrar novo responsável
      </button>

      <FormField label="Observações" {...field("observacoes")} textarea placeholder="Informações adicionais relevantes" />

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Check} onClick={() => { if (!cpfInvalido && !nascInvalido && !faltaResponsavel) onSave(form); }} disabled={faltaResponsavel}>
          {editingPatient ? "Salvar alterações" : "Cadastrar paciente"}
        </PrimaryButton>
      </div>
      {faltaResponsavel && <div style={{ fontSize: 12.5, color: T.danger, marginTop: 8, textAlign: "right" }}>Selecione o responsável para salvar.</div>}

      {novoResponsavel && (
        <GuardianModal
          onClose={() => setNovoResponsavel(false)}
          onSaved={(id) => { if (id) setForm((f) => ({ ...f, responsavelId: id })); }}
        />
      )}
    </Modal>
  );
}
