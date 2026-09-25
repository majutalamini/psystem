import { ChevronRight } from "lucide-react";
import { Card, CategoryIllustration, PageHeader } from "../../components/ui";
import { REPORT_CATEGORIES } from "../../data/reports";
import { T } from "../../styles/theme";

export default function RelatoriosHub({ onSelect }) {
  return (
    <div>
      <PageHeader title="Relatórios" subtitle="A sua gestão em um só lugar." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
        {REPORT_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card key={cat.key} style={{ padding: 0, overflow: "hidden", position: "relative", minHeight: 260, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "32px 32px 28px", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ width: 54, height: 54, borderRadius: "50%", background: cat.accentTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  <Icon size={26} color={cat.accent} />
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: cat.accent, marginBottom: 8 }}>{cat.label}</div>
                <p style={{ color: T.muted, fontSize: 14.5, lineHeight: 1.6, margin: "0 0 22px", maxWidth: 260 }}>{cat.subtitle}</p>
                <button
                  onClick={() => onSelect(cat.key)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, background: cat.accentTint, color: cat.accent, border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: "auto", alignSelf: "flex-start" }}
                >
                  Acessar relatório <ChevronRight size={16} />
                </button>
              </div>
              <CategoryIllustration icon={cat.icon} badgeIcon={cat.badgeIcon} accent={cat.accent} accentTint={cat.accentTint} />
              <div style={{ height: 5, background: cat.accent }} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
