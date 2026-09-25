import { X } from "lucide-react";
import { T } from "../../styles/theme";

export default function Modal({ title, onClose, children, width = 400 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,24,38,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
