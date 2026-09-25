import { useState } from "react";
import { Modal, PrimaryButton } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { inputStyle } from "../../../styles/formStyles";
import { T } from "../../../styles/theme";

export default function GenerateDeclarationModal({ template, onClose, onGenerate }) {
  const { patients } = useAppData();
  const [patientId, setPatientId] = useState(patients[0].id);
  const [values, setValues] = useState(() => Object.fromEntries(template.fields.map((f) => [f.key, f.default])));
  const patient = patients.find((p) => p.id === patientId);

  return (
    <Modal title={template.title} onClose={onClose} width={420}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>Paciente</label>
      <select value={patientId} onChange={(e) => setPatientId(Number(e.target.value))} style={inputStyle}>
        {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {template.fields.map((f) => (
        <div key={f.key}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: T.muted }}>{f.label}</label>
          {f.type === "select" ? (
            <select value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} style={inputStyle}>
              {f.options.map((o) => <option key={o}>{o}</option>)}
            </select>
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
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={() => onGenerate(patient, values)}>Gerar documento</PrimaryButton>
      </div>
    </Modal>
  );
}
