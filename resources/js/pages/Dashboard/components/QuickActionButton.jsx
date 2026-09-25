import { T } from "../../../styles/theme";

export default function QuickActionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 10,
        border: `1px solid ${T.border}`, background: "#fff", color: T.text, fontWeight: 600, fontSize: 13,
        cursor: "pointer", whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#F5F6FA"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
    >
      <Icon size={18} color={T.primary} />
      {label}
    </button>
  );
}
