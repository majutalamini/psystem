import { T, WA_GREEN } from "../../../styles/theme";

/* Botão de ação do cabeçalho do perfil (CADASTRO / WHATSAPP / MAIS AÇÕES) */
export default function ProfileActionButton({ icon: Icon, children, onClick, variant = "primary" }) {
  const variants = {
    primary: { bg: T.primary, color: "#fff", border: "none" },
    whatsapp: { bg: WA_GREEN, color: "#fff", border: "none" },
    ghost: { bg: "#fff", color: T.text, border: `1px solid ${T.border}` },
  };
  const v = variants[variant];
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "14px 22px", borderRadius: 12,
        background: v.bg, color: v.color, border: v.border, cursor: "pointer",
        fontSize: 15, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", whiteSpace: "nowrap",
      }}
    >
      {Icon && <Icon size={21} color={v.color} />}
      {children}
    </button>
  );
}
