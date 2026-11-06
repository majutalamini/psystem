import { useId, useState } from "react";
import { ErrorText, Modal, MoneyInput, PrimaryButton, PatientSelect, TimeInput, normalizeTime } from "../../../components/ui";
import { inputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";

export default function GenerateDeclarationModal({ template, onClose, onGenerate }) {
  const id = useId();
  const [patientId, setPatientId] = useState("");
  const [patient, setPatient] = useState(null);
  const defaultsFor = (p) => Object.fromEntries(template.fields.map((f) => [f.key, typeof f.default === "function" ? (p ? f.default(p) : "") : f.default]));
  const [values, setValues] = useState(() => defaultsFor(patient));
  const [tried, setTried] = useState(false);

  // Campos em reais precisam de um valor válido e maior que zero.
  const moneyErrors = Object.fromEntries(template.fields
    .filter((f) => f.type === "money" && !(values[f.key] > 0))
    .map((f) => [f.key, "Informe um valor em reais, só com números (ex.: 150,00)."]));
  const timeErrors = Object.fromEntries(template.fields.filter(f => f.type === "time" && !normalizeTime(values[f.key]))
    .map(f => [f.key, "Informe um horário válido (HH:MM)."]));

  function generate() {
    setTried(true);
    if (Object.keys(moneyErrors).length || Object.keys(timeErrors).length) return;
    onGenerate(patient, { ...values, ...Object.fromEntries(template.fields.filter(f => f.type === "time").map(f => [f.key, normalizeTime(values[f.key])])) });
  }

  function selectPatient(id, next) {
    const changed = id !== patientId;
    setPatientId(id);
    setPatient(next);
    if (!changed) return;
    // Refaz só os campos que dependem do paciente (ex.: data de início, valor da sessão).
    setValues((prev) => ({
      ...prev,
      ...Object.fromEntries(template.fields.filter((f) => typeof f.default === "function").map((f) => [f.key, f.default(next)])),
    }));
  }

  return (
    <Modal title={template.title} onClose={onClose} width={420}>
      <PatientSelect value={patientId} onChange={selectPatient} details />

      {template.fields.map((f) => (
        <div key={f.key}>
          {f.type !== "time" && <label htmlFor={`${id}-${f.key}`} style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>{f.label}</label>}
          {f.type === "time" ? <TimeInput label={f.label} value={values[f.key]} onChange={v => setValues(current => ({ ...current, [f.key]: v }))} required error={tried ? timeErrors[f.key] : undefined} /> : f.type === "select" ? (
            <select id={`${id}-${f.key}`} value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} style={inputStyle}>
              {f.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          ) : f.type === "money" ? (
            <>
              <MoneyInput
                id={`${id}-${f.key}`}
                value={values[f.key]}
                onChange={(v) => setValues({ ...values, [f.key]: v })}
                style={tried && moneyErrors[f.key] ? { ...inputStyle, borderColor: T.danger, marginBottom: 4 } : inputStyle}
              />
              {tried && <ErrorText>{moneyErrors[f.key]}</ErrorText>}
            </>
          ) : (
            <input
              id={`${id}-${f.key}`}
              type={f.type}
              value={values[f.key]}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              style={inputStyle}
            />
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={generate} disabled={!patient}>Gerar documento</PrimaryButton>
      </div>
    </Modal>
  );
}
