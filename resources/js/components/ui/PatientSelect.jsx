import { useEffect, useId, useRef, useState } from "react";
import { inputStyle } from "../../styles/formStyles";
import { T } from "../../styles/theme";
import Pagination from "./Pagination";

/* Pesquisa/paginação no servidor. O paciente escolhido continua selecionado
   mesmo fora da página filtrada; digitar uma busca não reseta o formulário. */
export default function PatientSelect({ value, onChange, details = false, label = "Paciente", error, onLoad }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [failure, setFailure] = useState("");
  const [attempt, setAttempt] = useState(0);
  const selectedId = useRef(value);
  const change = useRef(onChange), loaded = useRef(onLoad), detailRequest = useRef(null);
  selectedId.current = value;
  change.current = onChange;
  loaded.current = onLoad;
  useEffect(() => () => detailRequest.current?.abort(), []);
  useEffect(() => {
    const refresh = () => setAttempt(number => number + 1);
    window.addEventListener("psystem:read-refresh", refresh);
    return () => window.removeEventListener("psystem:read-refresh", refresh);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailure("");
    const requestedId = selectedId.current;
    const params = new URLSearchParams({ q: query, page: String(page), details: details ? "1" : "0" });
    if (selectedId.current) params.set("selected", String(selectedId.current));
    fetch(`/pacientes/opcoes?${params}`, { signal: controller.signal, headers: { Accept: "application/json" }, credentials: "same-origin" })
      .then(async response => {
        if (!response.ok) throw new Error("Opções indisponíveis");
        const result = await response.json();
        if (controller.signal.aborted) return;
        setData(result);
        if (!selectedId.current || selectedId.current === requestedId) {
          setSelected(result.selected);
          if (result.selected) change.current(result.selected.id, result.selected);
        }
        loaded.current?.(result);
      }).catch(() => {
        if (!controller.signal.aborted) setFailure("Não foi possível carregar os pacientes.");
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, page, details, attempt]);

  async function select(idValue) {
    const option = data.items.find(patient => patient.id === idValue) || selected;
    if (!option || option.id === selectedId.current) return;
    if (!details) {
      setSelected(option);
      change.current(option.id, option);
      return;
    }
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    setSelecting(true);
    setFailure("");
    try {
      const response = await fetch(`/pacientes/opcoes?selected=${idValue}&details=1`, { signal: controller.signal, headers: { Accept: "application/json" }, credentials: "same-origin" });
      if (!response.ok) throw new Error("Paciente indisponível");
      const result = await response.json();
      if (!result.selected) throw new Error("Paciente indisponível");
      if (!controller.signal.aborted) {
        setSelected(result.selected);
        change.current(result.selected.id, result.selected);
      }
    } catch {
      if (!controller.signal.aborted) setFailure("Não foi possível selecionar o paciente. Tente novamente.");
    } finally {
      if (!controller.signal.aborted) setSelecting(false);
    }
  }
  const items = data?.items || [];
  const options = selected && !items.some(patient => patient.id === selected.id) ? [selected, ...items] : items;
  const message = failure || error;
  return (
    <div aria-busy={loading || selecting}>
      <label htmlFor={id} style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: T.muted }}>{label}</label>
      <input type="search" aria-label={`Pesquisar ${label.toLowerCase()}`} placeholder="Pesquisar paciente para selecionar" autoComplete="off" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} style={{ ...inputStyle, marginBottom: 6 }} />
      <select id={id} aria-invalid={!!message} aria-describedby={message ? `${id}-error` : undefined} value={value || ""} disabled={loading || selecting || !options.length} onChange={event => select(Number(event.target.value))} style={{ ...inputStyle, marginBottom: 4, ...(message ? { borderColor: T.danger } : {}) }}>
        {!value && <option value="">{loading ? "Carregando…" : "Selecione um paciente"}</option>}
        {options.map(patient => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
      </select>
      {message && <div id={`${id}-error`} role="alert" style={{ color: T.danger, fontSize: 12.5, marginBottom: 8 }}>{message}</div>}
      {failure && <button type="button" onClick={() => setAttempt(number => number + 1)}>Tentar novamente</button>}
      {!loading && data?.pagination.total === 0 && <div role="status" style={{ color: T.muted, fontSize: 12.5 }}>Nenhum paciente encontrado.</div>}
      {data && data.pagination.lastPage > 1 && <Pagination pagination={data.pagination} onPage={setPage} label="pacientes do seletor" />}
      <div style={{ marginBottom: 12 }} />
    </div>
  );
}
