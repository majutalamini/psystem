import { useSyncExternalStore } from "react";

const pending = new Map(), listeners = new Set();
const notify = () => listeners.forEach(listener => listener());
const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
const snapshot = () => pending.size;
export const usePendingWrites = () => useSyncExternalStore(subscribe, snapshot, () => 0);

// A liberação do envio antigo não pode liberar uma nova requisição iniciada
// dentro de onSuccess (por exemplo, a sequência de importação de documentos).
export function claimWrite(key) {
  if (pending.has(key)) return null;
  const token = {};
  pending.set(key, token); notify();
  return () => { if (pending.get(key) === token) { pending.delete(key); notify(); } };
}
