import { T } from "./theme";

export const inputStyle = {
  width: "100%", padding: "11px 13px", borderRadius: 10, border: `1px solid ${T.border}`,
  fontSize: 14.5, margin: "7px 0 16px", boxSizing: "border-box", background: "#fff", color: T.text,
};

export const textareaStyle = { ...inputStyle, minHeight: 110, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 };

export const filterInputStyle = {
  padding: "9px 12px", borderRadius: 9, border: `1px solid ${T.border}`,
  fontSize: 13.5, background: "#fff", color: T.text, minWidth: 130, boxSizing: "border-box",
};

export const iconBtn = { width: 40, height: 40, borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.text };
