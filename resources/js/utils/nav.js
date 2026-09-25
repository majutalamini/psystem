import { router } from "@inertiajs/react";

export const ROUTES = {
  dashboard: "/",
  agenda: "/agenda",
  pacientes: "/pacientes",
  prontuarios: "/prontuarios",
  relatorios: "/relatorios",
  declaracoes: "/declaracoes",
  financeiro: "/financeiro",
  configuracoes: "/configuracoes",
};

/* Substitui o antigo onNavigate("pagina") do App.jsx. */
export function navigate(key, query) {
  router.visit(ROUTES[key], query ? { data: query } : {});
}

export function pageFromUrl(url) {
  const path = url.split("?")[0];
  if (path === "/") return "dashboard";
  return Object.keys(ROUTES).find((k) => k !== "dashboard" && path.startsWith(ROUTES[k])) || "dashboard";
}
