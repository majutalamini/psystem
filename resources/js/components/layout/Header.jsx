import { useState } from "react";
import { Brain, LogOut, Settings } from "lucide-react";
import { FONT_DISPLAY, T, WA_GREEN, WA_GREEN_DARK } from "../../styles/theme";
import WhatsappIcon from "../icons/WhatsappIcon";
import { Avatar } from "../ui";
import WhatsappQuickModal from "../whatsapp/WhatsappQuickModal";
import { useAppData } from "../../hooks/useAppData";
import { navigate } from "../../utils/nav";

const headerIconBtn = {
  width: 40, height: 40, borderRadius: "50%", border: "none", cursor: "pointer",
  background: "rgba(255,255,255,0.16)", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};

const waHeaderBtn = {
  display: "flex", alignItems: "center", gap: 9, height: 42, padding: "0 18px",
  borderRadius: 999, border: "none", cursor: "pointer", background: WA_GREEN, color: "#fff",
  fontSize: 14, fontWeight: 700, flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.16)",
  whiteSpace: "nowrap",
};

export default function Header() {
  const [showWhats, setShowWhats] = useState(false);
  const { auth, logout } = useAppData();
  const user = auth.user;
  return (
    <header style={{ display: "flex", alignItems: "center", gap: 20, background: T.primary, padding: "16px 28px", flexShrink: 0, width: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Brain size={27} color="#fff" />
        </div>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 31, letterSpacing: -0.6, color: "#fff" }}>Psystem</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0, marginLeft: "auto" }}>
        <button
          onClick={() => setShowWhats(true)}
          title="Enviar mensagem no WhatsApp"
          style={waHeaderBtn}
          onMouseEnter={(e) => (e.currentTarget.style.background = WA_GREEN_DARK)}
          onMouseLeave={(e) => (e.currentTarget.style.background = WA_GREEN)}
        >
          <WhatsappIcon size={20} color="#fff" /> WhatsApp
        </button>
        <button style={headerIconBtn} title="Configurações" onClick={() => navigate("configuracoes")}><Settings size={20} /></button>
        <button style={headerIconBtn} title="Sair" onClick={logout}><LogOut size={20} /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 4 }}>
          <Avatar initials={user.initials} color="purple" src={user.photo} size={42} />
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>{user.nome}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>Psicóloga</div>
          </div>
        </div>
      </div>

      {showWhats && <WhatsappQuickModal onClose={() => setShowWhats(false)} />}
    </header>
  );
}
