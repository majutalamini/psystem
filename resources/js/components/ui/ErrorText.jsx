import { T } from "../../styles/theme";

/* Mensagem de validação vinda do Laravel. */
export default function ErrorText({ children }) {
  if (!children) return null;
  return <div style={{ fontSize: 12.5, color: T.danger, marginTop: -10, marginBottom: 12 }}>{children}</div>;
}
