import { BackButton, Card, PageHeader } from "../../components/ui";
import { T } from "../../styles/theme";

export default function CategoryReportList({ category, onBack, onSelectReport }) {
  return (
    <div>
      <BackButton onClick={onBack}>Voltar para Relatórios</BackButton>
      <PageHeader title={`Relatórios de ${category.label.toLowerCase()}`} subtitle={category.subtitle} />
      <Card style={{ padding: "4px 24px" }}>
        {category.reports.map((r, i) => (
          <div
            key={r.key}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 0", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}
          >
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: T.text }}>{r.label}</div>
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>{r.desc}</div>
            </div>
            <button
              onClick={() => onSelectReport(r.key)}
              style={{ background: "none", border: "none", color: category.accent, fontWeight: 700, fontSize: 12.5, letterSpacing: 0.3, textTransform: "uppercase", cursor: "pointer", flexShrink: 0 }}
            >
              Visualizar
            </button>
          </div>
        ))}
      </Card>
    </div>
  );
}
