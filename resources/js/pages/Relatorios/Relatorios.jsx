import { useState } from "react";
import { router } from "@inertiajs/react";
import { DataContext } from "../../context/DataContext";
import { useAppData } from "../../hooks/useAppData";
import { BackButton } from "../../components/ui";
import { REPORT_CATEGORIES } from "../../data/reports";
import { T } from "../../styles/theme";
import CategoryReportList from "./CategoryReportList";
import { ReportTitleContext } from "./components/ReportTableCard";
import RelatoriosHub from "./RelatoriosHub";
import { REPORT_COMPONENTS } from "./reports/index";
import AsyncArea from "../../components/ui/AsyncArea";

export default function Relatorios({ activeReport, reportData }) {
  const appData = useAppData();
  const [categoryKey, setCategoryKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState("");
  const [requested, setRequested] = useState(null);
  const reportKey = activeReport;
  function openReport(key) {
    setRequested(key); setLoading(true); setFailure("");
    router.get("/relatorios", key ? { relatorio: key } : {}, {
      only: ["activeReport", "reportData", "errors", "flash"], preserveState: true, preserveScroll: true,
      onNetworkError: () => { setFailure("Não foi possível carregar o relatório."); return false; },
      onHttpException: () => { setFailure("Não foi possível carregar o relatório."); return false; },
      onFinish: () => setLoading(false),
    });
  }

  const category = REPORT_CATEGORIES.find((c) => reportKey ? c.reports.some(r => r.key === reportKey) : c.key === categoryKey);

  if (!category) {
    return <RelatoriosHub onSelect={(k) => setCategoryKey(k)} />;
  }

  if (!reportKey) {
    return (
      <div aria-busy={loading}>
      {loading && <div role="status">Carregando relatório…</div>}
      {failure && <div role="alert">{failure} <button onClick={() => openReport(requested)}>Tentar novamente</button></div>}
      <CategoryReportList
        category={category}
        onBack={() => setCategoryKey(null)}
        onSelectReport={openReport}
      />
      </div>
    );
  }

  const report = category.reports.find((r) => r.key === reportKey);
  const ReportComponent = REPORT_COMPONENTS[reportKey];

  return (
    <div>
      {loading && <div role="status">Carregando relatório…</div>}
      {failure && <div role="alert">{failure} <button onClick={() => openReport(requested)}>Tentar novamente</button></div>}
      <BackButton onClick={() => { setCategoryKey(category.key); openReport(null); }}>Voltar para relatórios de {category.label.toLowerCase()}</BackButton>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color: T.text, margin: 0 }}>{report ? report.label : ""}</h1>
        <p style={{ color: T.muted, fontSize: 14, marginTop: 4 }}>{report ? report.desc : ""}</p>
      </div>
      {ReportComponent && (
        <ReportTitleContext.Provider value={report ? report.label : "Relatório"}>
          <DataContext.Provider value={{ ...appData, ...reportData }}>
          <AsyncArea key={reportKey}><ReportComponent /></AsyncArea>
          </DataContext.Provider>
        </ReportTitleContext.Provider>
      )}
    </div>
  );
}
