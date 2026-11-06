import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";

/* Uma resposta mensal inclui as semanas completas da grade. Abortar a busca
   anterior impede que uma resposta atrasada substitua outro mês. */
export function useEventosDoMes(ativo, mesIso, eventosAtuais) {
  const { version } = usePage();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!ativo) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ data: mesIso, visao: "mes", grade: "1" });
    fetch(`/agenda?${params}`, {
      headers: {
        "X-Inertia": "true",
        "X-Inertia-Version": version || "",
        "X-Requested-With": "XMLHttpRequest",
        Accept: "text/html, application/xhtml+xml",
      },
      credentials: "same-origin",
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error("Resposta mensal inválida");
      const data = await response.json();
      if (!Array.isArray(data.props?.events)) throw new Error("Eventos ausentes");
      if (!controller.signal.aborted) setResult({ month: mesIso, events: data.props.events });
    }).catch(() => {
      if (!controller.signal.aborted) setError("Não foi possível carregar o mês.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [ativo, mesIso, eventosAtuais, version, attempt]);

  return {
    events: result?.month === mesIso ? result.events : eventosAtuais,
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
