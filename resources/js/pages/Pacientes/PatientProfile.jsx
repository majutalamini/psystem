import { useRef, useState } from "react";
import { ArrowLeft, BadgeCheck, CalendarClock, Camera, Check, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, Edit3, ExternalLink, FileText, HeartPulse, Paperclip, RefreshCw, User, Wallet } from "lucide-react";
import NewReceivableModal from "../../components/financeiro/NewReceivableModal";
import WhatsappIcon from "../../components/icons/WhatsappIcon";
import { Avatar, Card } from "../../components/ui";
import WhatsappQuickModal from "../../components/whatsapp/WhatsappQuickModal";
import { useAppData } from "../../hooks/useAppData";
import { T } from "../../styles/theme";
import { ageFromBrDate } from "../../utils/date";
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
  { key: "matricula", label: "Matrícula", icon: CalendarClock },
];

const profileTabArrow = {
  width: 40, height: 40, borderRadius: "50%", border: "none", background: "transparent",
  color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};

export default function PatientProfile({ patientId, onBack }) {
  const { patients, updatePatient, addReceivable } = useAppData();
  const [tab, setTab] = useState("dados");
  const [showEdit, setShowEdit] = useState(false);
  const [showWhats, setShowWhats] = useState(false);
  const [showReceivable, setShowReceivable] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const fileRef = useRef(null);
  const tabsRef = useRef(null);

  const patient = patients.find((p) => p.id === patientId);
  if (!patient) return null;

  const ativo = patient.status === "Ativo";
  const idade = ageFromBrDate(patient.nascimento);

  function handlePhoto(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updatePatient(patient.id, { photo: reader.result });
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function scrollTabs(dir) {
    if (tabsRef.current) tabsRef.current.scrollBy({ left: dir * 280, behavior: "smooth" });
  }

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: T.primary, fontWeight: 700, fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 16 }}>
        <ArrowLeft size={19} /> Voltar para pacientes
      </button>

      {/* Cabeçalho do paciente */}
      <Card style={{ padding: "28px 30px", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar
              initials={patient.initials}
              color={patient.color}
              src={patient.photo}
              size={118}
              style={{ border: `4px solid ${ativo ? T.success : "#C7CCDA"}` }}
            />
            <button
              onClick={() => fileRef.current && fileRef.current.click()}
              title="Alterar foto do paciente"
              style={{
                position: "absolute", right: 2, bottom: 6, width: 36, height: 36, borderRadius: "50%",
                background: T.primary, border: "3px solid #fff", color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Camera size={17} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 32, color: T.text, lineHeight: 1.15 }}>
                {patient.name}
              </span>
              <BadgeCheck size={26} color={T.primary} />
              <span style={{
                display: "flex", alignItems: "center", gap: 7, padding: "7px 16px", borderRadius: 999,
                background: ativo ? T.successTint : "#F1F3F9", color: ativo ? T.success : T.muted,
                fontSize: 14.5, fontWeight: 700,
              }}>
                <Check size={17} /> {patient.status}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: T.muted, marginTop: 8, flexWrap: "wrap" }}>
              <span>
                {idade != null ? `${idade} anos, ` : ""}{patient.genero || "Não informado"} | Convênio: {patient.convenio || "—"}
              </span>
              <button
                onClick={() => setTab("dados")}
                title="Ver dados pessoais"
                style={{ background: "none", border: "none", cursor: "pointer", color: T.primary, display: "flex", padding: 0 }}
              >
                <ExternalLink size={19} />
              </button>
            </div>

            <div style={{ fontSize: 14, color: T.muted, marginTop: 6 }}>
              {patient.sessions} sessões · última em {patient.lastSession} · próxima {patient.nextSession}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap", position: "relative" }}>
              <ProfileActionButton icon={Edit3} onClick={() => setShowEdit(true)}>Cadastro</ProfileActionButton>
              <ProfileActionButton icon={WhatsappIcon} variant="whatsapp" onClick={() => setShowWhats(true)}>WhatsApp</ProfileActionButton>
              <div style={{ position: "relative" }}>
                <ProfileActionButton icon={ClipboardList} variant="ghost" onClick={() => setShowMenu((v) => !v)}>Mais ações</ProfileActionButton>
                {showMenu && (
                  <>
                    <div onClick={() => setShowMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                    <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, width: 268, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, boxShadow: "0 14px 38px rgba(20,24,38,0.16)", padding: 8, zIndex: 41 }}>
                      {[
                        { label: "Novo registro no prontuário", icon: FileText, onClick: () => setTab("prontuario") },
                        { label: "Nova conta a receber", icon: CircleDollarSign, onClick: () => setShowReceivable(true) },
                        { label: "Ver anamnese", icon: HeartPulse, onClick: () => setTab("anamnese") },
                        { label: "Anexar documento", icon: Paperclip, onClick: () => setTab("documentos") },
                        { label: "Alterar foto", icon: Camera, onClick: () => fileRef.current && fileRef.current.click() },
                        {
                          label: ativo ? "Marcar como inativo" : "Marcar como ativo",
                          icon: RefreshCw,
                          tone: ativo ? "danger" : undefined,
                          onClick: () => updatePatient(patient.id, { status: ativo ? "Inativo" : "Ativo" }),
                        },
                      ].map((it) => (
                        <button
                          key={it.label}
                          onClick={() => { setShowMenu(false); it.onClick(); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left",
                            padding: "12px 13px", borderRadius: 9, border: "none", background: "none", cursor: "pointer",
                            fontSize: 14.5, fontWeight: 600, color: it.tone === "danger" ? T.danger : T.text,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F6FA")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        >
                          <it.icon size={18} /> {it.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Abas do perfil — roláveis horizontalmente, como no sistema de referência */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "0 10px", marginBottom: 24 }}>
        <button onClick={() => scrollTabs(-1)} style={profileTabArrow} title="Abas anteriores"><ChevronLeft size={24} /></button>
        <div ref={tabsRef} className="profile-tabs" style={{ display: "flex", gap: 2, overflowX: "auto", flex: 1 }}>
          {PROFILE_TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "22px 24px 18px", background: "none", cursor: "pointer",
                  border: "none", borderBottom: active ? `4px solid ${T.primary}` : "4px solid transparent",
                  color: active ? T.primary : T.muted,
                  fontWeight: 800, fontSize: 16, textTransform: "uppercase", letterSpacing: 0.7,
                  whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <button onClick={() => scrollTabs(1)} style={profileTabArrow} title="Próximas abas"><ChevronRight size={24} /></button>
      </div>

      {tab === "dados" && <DadosPessoaisTab patient={patient} />}
      {tab === "anamnese" && <AnamneseTab patient={patient} />}
      {tab === "prontuario" && <ProntuarioTab patient={patient} />}
      {tab === "financeiro" && <FinanceiroTab patient={patient} />}
      {tab === "documentos" && <DocumentosTab patient={patient} />}
      {tab === "matricula" && <MatriculaTab patient={patient} />}

      {showEdit && (
        <NewPatientModal
          editingPatient={patient}
          onClose={() => setShowEdit(false)}
          onSave={(updated) => { updatePatient(patient.id, updated); setShowEdit(false); }}
        />
      )}

      {showWhats && (
        <WhatsappQuickModal initialPatientId={patient.id} onClose={() => setShowWhats(false)} />
      )}

      {showReceivable && (
        <NewReceivableModal
          defaultPatientName={patient.name}
          onClose={() => setShowReceivable(false)}
          onSave={(entry) => { addReceivable(entry); setShowReceivable(false); setTab("financeiro"); }}
        />
      )}
    </div>
  );
}
