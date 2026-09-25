import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { REPORT_CATEGORIES } from "../../data/reports";
import { T } from "../../styles/theme";
import CategoryReportList from "./CategoryReportList";
import RelatoriosHub from "./RelatoriosHub";
import { REPORT_COMPONENTS } from "./reports/index";

export default function Relatorios() {
  const [categoryKey, setCategoryKey] = useState(null);
  const [reportKey, setReportKey] = useState(null);

  const category = REPORT_CATEGORIES.find((c) => c.key === categoryKey);

  if (!category) {
    return <RelatoriosHub onSelect={(k) => setCategoryKey(k)} />;
  }

  if (!reportKey) {
    return (
      <CategoryReportList
        category={category}
        onBack={() => setCategoryKey(null)}
        onSelectReport={(k) => setReportKey(k)}
      />
    );
  }

  const report = category.reports.find((r) => r.key === reportKey);
  const ReportComponent = REPORT_COMPONENTS[reportKey];

  return (
    <div>
      <button
        onClick={() => setReportKey(null)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: T.muted, fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 14, padding: 0 }}
      >
        <ArrowLeft size={16} /> Voltar para relatórios de {category.label.toLowerCase()}
      </button>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color: T.text, margin: 0 }}>{report ? report.label : ""}</h1>
        <p style={{ color: T.muted, fontSize: 14, marginTop: 4 }}>{report ? report.desc : ""}</p>
      </div>
      {ReportComponent && <ReportComponent />}
    </div>
  );
}
