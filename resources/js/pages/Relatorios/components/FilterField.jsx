import { T } from "../../../styles/theme";

export default function FilterField({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}
