import { useState } from "react";
import { Check } from "lucide-react";
import { Card, ErrorText, FormField, PrimaryButton } from "../../../components/ui";
import { ANAMNESE_FIELDS } from "../../../data/anamnese";
import { useAppData } from "../../../hooks/useAppData";
import { T } from "../../../styles/theme";
import { ageFromBrDate } from "../../../utils/date";
import { maskDate, maskNumber, maskPhone } from "../../../utils/format";

/* As perguntas vêm do banco; o rótulo diz se a resposta pede uma caixa de texto grande. */
const TEXTAREA_LABELS = new Set(ANAMNESE_FIELDS.filter((f) => f.textarea).map((f) => f.label));

/* Campos que o cadastro do paciente já responde ("seção|pergunta"). Na anamnese infantil o paciente é a criança. */
function doCadastro(patient) {
  const idade = ageFromBrDate(patient.nascimento);
  const identificacao = "Dados de identificação";
  return {
    [`${identificacao}|Nome`]: patient.name,
    [`${identificacao}|Data de nascimento`]: patient.nascimento,
    [`${identificacao}|Idade`]: idade != null ? String(idade) : "",
    [`${identificacao}|Cidade`]: patient.cidade,
    [`${identificacao}|Estado`]: patient.uf,
    [`${identificacao}|Endereço`]: patient.endereco,
    [`${identificacao}|Sexo`]: patient.genero,
    [`${identificacao}|Celular`]: patient.phone,
    [`${identificacao}|Recado`]: patient.emergenciaTelefone,
    [`${identificacao} dos pais|Endereço`]: patient.endereco,
  };
}

/* Máscara de cada tipo de pergunta, pelo texto dela: idades só com números, datas e telefones formatados. */
function mascaraDe(label) {
  if (/^Idade/.test(label)) return { fn: (v) => maskNumber(v, 3), inputMode: "numeric", maxLength: 3 };
  if (/^Data de nascimento/.test(label)) return { fn: maskDate, inputMode: "numeric", maxLength: 10, placeholder: "dd/mm/aaaa" };
  if (/^(Telefone fixo|Celular|Recado)$/.test(label)) return { fn: maskPhone, inputMode: "tel", maxLength: 15, placeholder: "(00) 00000-0000" };
  return null;
}

/* initial = { titulo, respostas }. Cada anamnese é independente: salvar uma não altera as outras do paciente. */
export default function AnamneseForm({ patient, secoes, initial, editando, onCancel, onSave }) {
  const { errors = {} } = useAppData();
  const [titulo, setTitulo] = useState(initial.titulo || "");
  // Versão aberta, guardada no início da edição: se outra pessoa salvar antes, o servidor recusa sem sobrescrever.
  const [versao] = useState(initial.versao);
  // Anamnese nova já vem com o que está no cadastro do paciente; o que ela já tem preenchido não é sobrescrito.
  const [respostas, setRespostas] = useState(() => {
    const base = { ...initial.respostas };
    if (editando) return base;
    const cadastro = doCadastro(patient);
    secoes.forEach((s) => s.fields.forEach((f) => {
      const valor = cadastro[`${s.title}|${f.label}`];
      if (valor && !base[f.key]) base[f.key] = valor;
    }));
    return base;
  });

  return (
    <Card style={{ padding: 24, marginBottom: 16 }}>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 18 }}>
        {editando
          ? "Você está editando esta anamnese. As outras anamneses do paciente não são alteradas."
          : "Esta será uma nova anamnese; as que o paciente já tem continuam como estão. Os dados do cadastro do paciente já foram preenchidos."}
      </div>

      <div style={{ maxWidth: 420, marginBottom: 8 }}>
        <FormField label="Título (opcional)" value={titulo} onChange={setTitulo} placeholder="Ex.: Acolhimento inicial, Reavaliação 2026" error={errors.titulo} />
      </div>

      {secoes.map((section) => (
        <div key={section.title} style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>
            {section.title}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            {section.fields.map((f) => {
              const textarea = TEXTAREA_LABELS.has(f.label);
              const mascara = mascaraDe(f.label);
              return (
                <div key={f.key} style={{ gridColumn: textarea ? "1 / -1" : undefined }}>
                  <FormField
                    label={f.label} value={respostas[f.key]} textarea={textarea}
                    onChange={(v) => setRespostas({ ...respostas, [f.key]: mascara ? mascara.fn(v) : v })}
                    placeholder={mascara?.placeholder} inputMode={mascara?.inputMode} maxLength={mascara?.maxLength}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <ErrorText>{errors.respostas}</ErrorText>
      <div style={{ display: "flex", gap: 10, marginTop: 8, position: "sticky", bottom: 0, background: T.surface, paddingTop: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} icon={Check} onClick={() => onSave(editando ? { titulo, respostas, versao } : { titulo, respostas })}>
          {editando ? "Salvar alterações" : "Salvar anamnese"}
        </PrimaryButton>
      </div>
    </Card>
  );
}
