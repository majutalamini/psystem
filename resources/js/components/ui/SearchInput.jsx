import { Search } from "lucide-react";
import { T } from "../../styles/theme";

export default function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 320 }}>
      <Search size={18} color={T.muted} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 12px 10px 40px", borderRadius: 10, border: `1px solid ${T.border}`,
          fontSize: 14, outline: "none", background: T.surface, color: T.text, boxSizing: "border-box",
        }}
      />
    </div>
  );
}
