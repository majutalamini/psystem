import { T } from "../../styles/theme";

export default function Switch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 42, height: 24, borderRadius: 999, border: "none", cursor: "pointer",
        background: checked ? T.primary : "#DFE3EE", position: "relative", transition: "background .15s",
        padding: 0, flexShrink: 0,
      }}
      aria-pressed={checked}
    >
      <span
        style={{
          position: "absolute", top: 3, left: checked ? 21 : 3, width: 18, height: 18,
          borderRadius: "50%", background: "#fff", transition: "left .15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        }}
      />
    </button>
  );
}
