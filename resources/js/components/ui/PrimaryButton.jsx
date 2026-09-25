import { T } from "../../styles/theme";

export default function PrimaryButton({ children, onClick, icon: Icon, style = {}, type = "button", disabled = false }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        opacity: disabled ? 0.6 : 1,
        display: "flex", alignItems: "center", gap: 8, background: T.primary, color: "#fff",
        border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 600,
        cursor: "pointer", boxShadow: "0 4px 10px rgba(76,111,255,0.25)", ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.primaryDark)}
      onMouseLeave={(e) => (e.currentTarget.style.background = T.primary)}
    >
      {Icon && <Icon size={19} />}
      {children}
    </button>
  );
}
