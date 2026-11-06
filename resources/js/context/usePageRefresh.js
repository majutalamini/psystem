import { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { readsFor } from "./refreshContracts";

export default function usePageRefresh(current) {
  const [failure, setFailure] = useState("");
  const refresh = useRef(() => {});
  useEffect(() => {
    let busy = false, pending = false, timer;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (document.visibilityState === "hidden") return;
        if (busy) { pending = true; return; }
        pending = false;
        const only = readsFor(current.current);
        window.dispatchEvent(new Event("psystem:read-refresh"));
        if (!only.length) return;
        router.reload({ only: [...only, "auth", "errors", "flash"], preserveState: true, preserveScroll: true,
          onSuccess: () => setFailure(""),
          onNetworkError: () => { setFailure("Não foi possível atualizar os dados. Suas edições foram preservadas."); return false; },
          onHttpException: () => { setFailure("Não foi possível atualizar os dados. Tente novamente."); return false; },
        });
      }, 30);
    };
    refresh.current = schedule;
    const start = router.on("start", () => { busy = true; });
    const finish = router.on("finish", () => { busy = false; if (pending) schedule(); });
    const visible = () => { if (document.visibilityState === "visible") schedule(); };
    window.addEventListener("focus", schedule);
    window.addEventListener("popstate", schedule);
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearTimeout(timer); start(); finish();
      window.removeEventListener("focus", schedule); window.removeEventListener("popstate", schedule);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [current]);
  return { failure, retry: () => refresh.current() };
}
