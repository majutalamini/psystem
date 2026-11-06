import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { Profiler } from "react";
import AppLayout from "./components/layout/AppLayout";
import "../css/theme.css";
import { T } from "./styles/theme";
import { registrarAlertasDeRede } from "./utils/alertas";
import { erro } from "./utils/alertas";

const pages = import.meta.glob(["./pages/*/*.jsx", "!./pages/Relatorios/CategoryReportList.jsx", "!./pages/Relatorios/RelatoriosHub.jsx"]);
const resolvedPages = new Map();

function recordReactCommit(id, phase, actualDuration, baseDuration, startTime, commitTime) {
  // Só números e identificadores técnicos; nenhum conteúdo de props/formulários.
  const samples = window.__psystemReactCommits ??= [];
  if (samples.length < 10000) samples.push({ id, phase, actualDuration, baseDuration, startTime, commitTime });
}

function resolvePage(name) {
  const key = `./pages/${name}.jsx`;
  if (!pages[key]) throw new Error(`Página não encontrada: ${name}`);
  if (!resolvedPages.has(key)) {
    resolvedPages.set(key, pages[key]().then(module => {
      if (!__PSYSTEM_PROFILING__) return module;
      const Page = module.default;
      function ProfiledPage(props) {
        return <Profiler id={key} onRender={recordReactCommit}><Page {...props} /></Profiler>;
      }
      return { ...module, default: ProfiledPage };
    }).catch(error => {
      resolvedPages.delete(key);
      erro("Não foi possível carregar a página. Verifique a conexão e tente novamente.");
      throw error;
    }));
  }
  return resolvedPages.get(key);
}

registrarAlertasDeRede();

createInertiaApp({
  title: (title) => (title ? `${title} · Psystem` : "Psystem"),
  resolve: resolvePage,
  // Todas as telas usam o layout com cabeçalho e menu, menos o login.
  layout: (name) => (name.startsWith("Auth/") ? null : AppLayout),
  setup({ el, App, props }) {
    const tree = <App {...props} />;
    createRoot(el).render(__PSYSTEM_PROFILING__ ? (
      <Profiler id="Psystem" onRender={recordReactCommit}>{tree}</Profiler>
    ) : tree);
  },
  progress: { color: T.primary },
});
