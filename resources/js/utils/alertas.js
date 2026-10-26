import { router } from "@inertiajs/react";
import Swal from "sweetalert2";
import { T } from "../styles/theme";

const base = { background: T.surface, color: T.text, confirmButtonColor: T.primary, cancelButtonColor: T.muted };

const toast = Swal.mixin({ ...base, toast: true, position: "top-end", showConfirmButton: false, timer: 3500, timerProgressBar: true });

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function sucesso(texto) {
  return toast.fire({ icon: "success", title: texto });
}

export function erro(texto, titulo = "Não foi possível concluir") {
  return Swal.fire({ ...base, icon: "error", title: titulo, text: texto, confirmButtonText: "Entendi" });
}

export function errosDeCampo(errors) {
  const itens = [...new Set(Object.values(errors))].slice(0, 5).map((m) => `<li>${escapar(m)}</li>`).join("");
  return Swal.fire({
    ...base,
    icon: "error",
    title: "Revise os dados",
    html: `<ul style="text-align:left;margin:0;padding-left:1.2em">${itens}</ul>`,
    confirmButtonText: "Entendi",
  });
}

export async function confirmar({ titulo, texto, confirmar: rotulo = "Confirmar", perigo = false }) {
  const { isConfirmed } = await Swal.fire({
    ...base,
    icon: perigo ? "warning" : "question",
    title: titulo,
    text: texto,
    showCancelButton: true,
    confirmButtonText: rotulo,
    cancelButtonText: "Cancelar",
    confirmButtonColor: perigo ? T.danger : T.primary,
    reverseButtons: true,
    focusCancel: perigo,
  });
  return isConfirmed;
}

const MENSAGENS_HTTP = {
  403: "Você não tem permissão para fazer isso.",
  404: "Não encontramos o que você procurava.",
  419: "Sua sessão expirou. Recarregue a página e tente de novo.",
  429: "Muitas tentativas seguidas. Aguarde um instante e tente de novo.",
  500: "Algo deu errado no sistema. Tente de novo em instantes.",
};

export function registrarAlertasDeRede() {
  router.on("httpException", (event) => {
    const { status } = event.detail.response;
    erro(MENSAGENS_HTTP[status] || (status >= 500 ? MENSAGENS_HTTP[500] : "Não foi possível concluir a ação."), "Ops!");
    return false;
  });
  router.on("networkError", () => {
    erro("Sem conexão com o servidor. Confira a internet e tente de novo.", "Ops!");
    return false;
  });
}
