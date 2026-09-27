import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import AppLayout from "./components/layout/AppLayout";
import { T } from "./styles/theme";

const pages = import.meta.glob("./pages/**/*.jsx", { eager: true });

createInertiaApp({
  title: (title) => (title ? `${title} · Psystem` : "Psystem"),
  resolve: (name) => {
    const page = pages[`./pages/${name}.jsx`];
    if (!page) throw new Error(`Página não encontrada: ${name}`);
    return page;
  },
  // Todas as telas usam o layout com cabeçalho e menu, menos o login.
  layout: (name) => (name.startsWith("Auth/") ? null : AppLayout),
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
  progress: { color: T.primary },
});
