import { useState } from "react";
import { ErrorText, Modal, MoneyInput, PrimaryButton } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { inputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";

export default function GenerateDeclarationModal({ template, onClose, onGenerate }) {
  const { patients } = useAppData();
  const [patientId, setPatientId] = useState(patients[0] ? patients[0].id : null);
  const patient = patients.find((p) => p.id === patientId);
  const defaultsFor = (p) => Object.fromEntries(template.fields.map((f) => [f.key, typeof f.default === "function" ? (p ? f.default(p) : "") : f.default]));
  const [values, setValues] = useState(() => defaultsFor(patient));
  const [tried, setTried] = useState(false);

  // Campos em reais precisam de um valor válido e maior que zero.
  const moneyErrors = Object.fromEntries(template.fields
    .filter((f) => f.type === "money" && !(values[f.key] > 0))
    .map((f) => [f.key, "Informe um valor em reais, só com números (ex.: 150,00)."]));

  function generate() {
    setTried(true);
    if (Object.keys(moneyErrors).length) return;
    onGenerate(patient, values);
  }

  function selectPatient(id) {
    const next = patients.find((p) => p.id === id);
    setPatientId(id);
    // Refaz só os campos que dependem do paciente (ex.: data de início, valor da sessão).
    setValues((prev) => ({
      ...prev,
      ...Object.fromEntries(template.fields.filter((f) => typeof f.default === "function").map((f) => [f.key, f.default(next)])),
    }));
  }

  if (!patient) {
    return (
      <Modal title={template.title} onClose={onClose} width={420}>
        <div style={{ fontSize: 13.5, color: T.muted }}>Cadastre um paciente para gerar declarações.</div>
      </Modal>
    );
  }

  return (
    <Modal title={template.title} onClose={onClose} width={420}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Paciente</label>
      <select value={patientId} onChange={(e) => selectPatient(Number(e.target.value))} style={inputStyle}>
        {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {template.fields.map((f) => (
        <div key={f.key}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>{f.label}</label>
          {f.type === "select" ? (
            <select value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} style={inputStyle}>
              {f.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          ) : f.type === "money" ? (
            <>
              <MoneyInput
                value={values[f.key]}
                onChange={(v) => setValues({ ...values, [f.key]: v })}
                style={tried && moneyErrors[f.key] ? { ...inputStyle, borderColor: T.danger, marginBottom: 4 } : inputStyle}
              />
              {tried && <ErrorText>{moneyErrors[f.key]}</ErrorText>}
            </>
          ) : (
            <input
              type={f.type}
              value={values[f.key]}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              style={inputStyle}
            />
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={generate}>Gerar documento</PrimaryButton>
      </div>
    </Modal>
  );
}
