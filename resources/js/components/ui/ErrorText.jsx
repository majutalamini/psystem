import { T } from "../../styles/theme";

/* Mensagem de validação vinda do Laravel. Com id, o campo pode apontar para ela (aria-describedby). */
export default function ErrorText({ children, id }) {
  if (!children) return null;
  return <div id={id} role="alert" style={{ fontSize: 12.5, color: T.danger, marginTop: -10, marginBottom: 12 }}>{children}</div>;
}
