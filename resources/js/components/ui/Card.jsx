import { T } from "../../styles/theme";

export default function Card({ children, className = "", style = {} }) {
  return (
    <div
      className={className}
      style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 16, boxShadow: "0 1px 2px rgba(28,34,51,0.03)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
