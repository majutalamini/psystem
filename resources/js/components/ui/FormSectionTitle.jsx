import { FONT_DISPLAY, T } from "../../styles/theme";

/* Título das seções do formulário — rótulo em destaque com um filete até o fim da linha. */
export default function FormSectionTitle({ children, first }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: first ? "0 0 12px" : "22px 0 12px" }}>
      <span style={{
        fontFamily: FONT_DISPLAY, fontSize: 12.5, fontWeight: 700, color: T.primary,
        textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap",
      }}>{children}</span>
      <span style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}
