import { useRef, useState } from "react";
import { CalendarClock, Camera, Check, Edit3, FileText, HeartPulse, Paperclip, User, Wallet } from "lucide-react";
import { Avatar, BackButton, Card } from "../../components/ui";
import { useAppData } from "../../hooks/useAppData";
import { FONT_DISPLAY, T } from "../../styles/theme";
import { ageFromBrDate } from "../../utils/date";
import { navigate } from "../../utils/nav";
import NewPatientModal from "./components/NewPatientModal";
import ProfileActionButton from "./components/ProfileActionButton";
import AnamneseTab from "./tabs/AnamneseTab";
import DadosPessoaisTab from "./tabs/DadosPessoaisTab";
import DocumentosTab from "./tabs/DocumentosTab";
import FinanceiroTab from "./tabs/FinanceiroTab";
import MatriculaTab from "./tabs/MatriculaTab";
import ProntuarioTab from "./tabs/ProntuarioTab";

const PROFILE_TABS = [
  { key: "dados", label: "Dados pessoais", icon: User },
  { key: "prontuario", label: "Prontuários", icon: FileText },
  { key: "anamnese", label: "Anamnese", icon: HeartPulse },
  { key: "documentos", label: "Documentos", icon: Paperclip },
  { key: "financeiro", label: "Financeiro", icon: Wallet },
  { key: "matricula", label: "Matrículas", icon: CalendarClock },
];

export default function PatientProfile({ patientId, records, anamnese, documents, receivables }) {
  const { patients, updatePatient, updatePatientPhoto } = useAppData();
  const [tab, setTab] = useState(() => {
    const aba = new URLSearchParams(window.location.search).get("aba");
    return PROFILE_TABS.some((t) => t.key === aba) ? aba : "dados";
  });
  const [showEdit, setShowEdit] = useState(() => new URLSearchParams(window.location.search).get("editar") === "1");
  const fileRef = useRef(null);

  const patient = patients.find((p) => p.id === patientId);
  if (!patient) return null;

  const ativo = patient.status === "Ativo";
  const idade = ageFromBrDate(patient.nascimento);

  function handlePhoto(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    updatePatientPhoto(patient.id, file);
    e.target.value = "";
  }

  return (
    <div>
      <BackButton onClick={() => navigate("pacientes")}>Voltar para pacientes</BackButton>

      {/* Cabeçalho do paciente */}
      <Card style={{ overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "26px 32px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar
              initials={patient.initials}
              color={patient.color}
              src={patient.photo}
              size={108}
              style={{ border: `5px solid ${T.surface}`, boxShadow: `0 0 0 3px ${ativo ? T.success : T.faint}` }}
            />
            <button
              onClick={() => fileRef.current && fileRef.current.click()}
              title="Alterar foto do paciente"
              style={{
                position: "absolute", right: -2, bottom: 4, width: 34, height: 34, borderRadius: "50%",
                background: T.primary, border: "3px solid #fff", color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Camera size={16} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
          </div>

          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 28, color: T.text, lineHeight: 1.15 }}>
                {patient.name}
              </span>
              <span style={{
                display: "flex", alignItems: "center", gap: 6, padding: "5px 13px", borderRadius: 999,
                background: ativo ? T.successTint : T.mutedBg, color: ativo ? T.success : T.muted,
                fontSize: 13, fontWeight: 700,
              }}>
                <Check size={15} /> {patient.status}
              </span>
            </div>
            <div style={{ fontSize: 14.5, color: T.muted, marginTop: 6 }}>
              {[idade != null ? `${idade} anos` : null, patient.genero].filter(Boolean).join(" · ")}
            </div>
          </div>

          <div>
            <ProfileActionButton icon={Edit3} onClick={() => setShowEdit(true)}>Cadastro</ProfileActionButton>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", borderTop: `1px solid ${T.border}` }}>
          {[
            { label: "Sessões", value: patient.sessions },
            { label: "Última sessão", value: patient.lastSession },
            { label: "Próxima sessão", value: patient.nextSession },
          ].map((it, i) => (
            <div key={it.label} style={{ padding: "16px 24px", textAlign: "center", borderLeft: i > 0 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: 0.3, textTransform: "uppercase" }}>{it.label}</div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: T.text, marginTop: 3 }}>{it.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Abas do perfil */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8, width: "100%", background: T.surface, border: `1.5px solid ${T.primary}`, borderRadius: 18, padding: 8, boxShadow: "0 4px 14px rgba(76,111,255,0.12)" }}>
          {PROFILE_TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", flex: "1 1 auto", gap: 9, padding: "13px 22px", borderRadius: 12, border: "none", cursor: "pointer",
                  background: active ? T.primary : "transparent", color: active ? T.surface : T.text,
                  fontFamily: FONT_DISPLAY, fontWeight: active ? 600 : 500, fontSize: 16, letterSpacing: 0.1, whiteSpace: "nowrap",
                  boxShadow: active ? "0 4px 10px rgba(76,111,255,0.28)" : "none", transition: "background .15s, color .15s",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = T.primaryTint; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <t.icon size={19} color={active ? "#fff" : T.primary} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "dados" && <DadosPessoaisTab patient={patient} />}
      {tab === "anamnese" && <AnamneseTab patient={patient} anamnese={anamnese} />}
      {tab === "prontuario" && <ProntuarioTab patient={patient} records={records} />}
      {tab === "financeiro" && <FinanceiroTab patient={patient} receivables={receivables} />}
      {tab === "documentos" && <DocumentosTab patient={patient} documents={documents} />}
      {tab === "matricula" && <MatriculaTab patient={patient} />}

      {showEdit && (
        <NewPatientModal
          editingPatient={patient}
          onClose={() => setShowEdit(false)}
          onSave={(updated) => updatePatient(patient.id, updated, { onSuccess: () => setShowEdit(false) })}
        />
      )}
    </div>
  );
}
