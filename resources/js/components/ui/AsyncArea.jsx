import { Component, Suspense } from "react";
import { T } from "../../styles/theme";

class LoadingError extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div role="alert" style={{ minHeight: this.props.height, padding: 16, color: T.danger }}>
      Não foi possível carregar esta área. <button type="button" onClick={() => window.location.reload()}>Recarregar página</button>
    </div>;
    return this.props.children;
  }
}

export default function AsyncArea({ children, height = 240 }) {
  return <LoadingError height={height}><Suspense fallback={<div role="status" style={{ height, color: T.muted }}>Carregando…</div>}>{children}</Suspense></LoadingError>;
}
