import { useRef, useState } from "react";
import { Camera, User } from "lucide-react";
import { Avatar } from "../../../components/ui";
import { FONT_DISPLAY, T } from "../../../styles/theme";
import Field from "../components/Field";
import SettingsSection from "../components/SettingsSection";

export default function PerfilTab() {
  const [photo, setPhoto] = useState(null);
  const fileRef = useRef(null);

  function handlePhoto(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <SettingsSection
      icon={User}
      title="Perfil profissional"
      description="Esses dados aparecem no topo do sistema e nas declarações e recibos emitidos para os pacientes."
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 26, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Avatar initials="IT" color="purple" src={photo} size={86} style={{ border: `3px solid ${T.primaryTint}` }} />
          <button
            onClick={() => fileRef.current && fileRef.current.click()}
            title="Alterar foto"
            style={{ position: "absolute", right: -2, bottom: 0, width: 32, height: 32, borderRadius: "50%", background: T.primary, border: "3px solid #fff", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Camera size={15} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
        </div>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, fontWeight: 700, color: T.text }}>Dra. Isadora Talamini</div>
          <div style={{ fontSize: 14, color: T.muted, marginTop: 3 }}>Psicóloga · CRP 12/34567</div>
          <button
            onClick={() => fileRef.current && fileRef.current.click()}
            style={{ marginTop: 10, padding: "9px 15px", borderRadius: 9, border: `1px solid ${T.border}`, background: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", color: T.text }}
          >
            Alterar foto
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0 20px" }}>
        <Field label="Nome completo" defaultValue="Dra. Isadora Talamini" />
        <Field label="CRP" defaultValue="12/34567" />
        <Field label="E-mail" defaultValue="isadora.talamini@psystem.com" type="email" />
        <Field label="Telefone" defaultValue="(48) 99876-5432" />
      </div>
    </SettingsSection>
  );
}
