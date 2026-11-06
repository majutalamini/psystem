import { T } from "../../styles/theme";
import { usePendingWrites } from "../../context/pendingWrites";

export default function PrimaryButton({ children, onClick, icon: Icon, style = {}, type = "button", disabled = false }) {
  const pending = usePendingWrites(), blocked = disabled || pending > 0;
  return (
    <button
      type={type}
      disabled={blocked}
      aria-busy={pending > 0 || undefined}
      onClick={onClick}
      style={{
        opacity: blocked ? 0.6 : 1,
        display: "flex", alignItems: "center", gap: 8, background: T.primary, color: "#fff",
        border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 600,
        cursor: blocked ? "wait" : "pointer", boxShadow: "0 4px 10px rgba(76,111,255,0.25)", ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.primaryHover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = T.primary)}
    >
      {Icon && <Icon size={19} />}
      {children}
    </button>
  );
}
