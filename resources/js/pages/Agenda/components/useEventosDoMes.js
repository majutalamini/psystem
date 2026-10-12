import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";

/* O servidor entrega só a semana aberta. Para a visão de mês, busca as outras semanas (mesma rota /agenda,
   no formato do Inertia) e junta tudo. Se uma busca falhar, aquela semana só fica sem consultas. */
export function useEventosDoMes(ativo, semanas, semanaAtual, eventosAtuais) {
  const { version } = usePage();
  const [porSemana, setPorSemana] = useState({});
  const chave = semanas.join(",");

  useEffect(() => {
    if (!ativo) return undefined;
    let cancelado = false;
    const faltam = semanas.filter((w) => w !== semanaAtual);
    Promise.all(faltam.map(async (w) => {
      try {
        const resp = await fetch(`/agenda?data=${w}`, {
          headers: {
            "X-Inertia": "true",
            "X-Inertia-Version": version || "",
            "X-Requested-With": "XMLHttpRequest",
            Accept: "text/html, application/xhtml+xml",
          },
          credentials: "same-origin",
        });
        if (!resp.ok) return [w, []];
        const json = await resp.json();
        return [w, (json.props && json.props.events) || []];
      } catch {
        return [w, []];
      }
    })).then((pares) => { if (!cancelado) setPorSemana(Object.fromEntries(pares)); });
    return () => { cancelado = true; };
  }, [ativo, chave, semanaAtual, eventosAtuais, version]);

  return [...eventosAtuais, ...Object.values(porSemana).flat()];
}
