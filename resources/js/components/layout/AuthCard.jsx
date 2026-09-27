import { usePage } from "@inertiajs/react";
import { Brain } from "lucide-react";
import { FONT_DISPLAY, T } from "../../styles/theme";
import { Card } from "../ui";
import GlobalStyles from "./GlobalStyles";

/* Moldura das telas sem login (entrar, esqueci a senha, nova senha), com o aviso vindo do servidor. */
export default function AuthCard({ title, children }) {
  const { flash } = usePage().props;
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "'Inter', sans-serif" }}>
      <GlobalStyles />
      <Card style={{ width: 380, maxWidth: "100%", padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: title ? 14 : 24 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Brain size={27} color="#fff" />
          </div>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 28, color: T.text }}>Psystem</span>
        </div>
        {title && <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 16 }}>{title}</div>}
        {flash && flash.aviso && (
          <div style={{ background: T.successTint, color: T.success, borderRadius: 10, padding: "10px 14px", fontSize: 13.5, fontWeight: 600, marginBottom: 16 }}>
            {flash.aviso}
          </div>
        )}
        {children}
      </Card>
    </div>
  );
}
