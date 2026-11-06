import { useMemo, useRef } from "react";
import { router, usePage } from "@inertiajs/react";
import { erro, errosDeCampo, sucesso } from "../utils/alertas";
import { DataContext } from "./DataContext";
import { writeReads } from "./refreshContracts";
import usePageRefresh from "./usePageRefresh";
import { claimWrite } from "./pendingWrites";

/* Os dados vêm do Laravel (props do Inertia) e as ações viram requisições.
   As telas continuam usando useAppData() como antes. */
const keep = { preserveScroll: true };
const withFiles = { ...keep, forceFormData: true };

const feedback = (mensagem, opts = {}) => ({
  ...opts,
  onSuccess: (page) => {
    const flash = page.props.flash || {};
    if (flash.erro) erro(flash.erro);
    else sucesso(flash.sucesso || mensagem);
    if (opts.onSuccess) opts.onSuccess(page);
  },
  onError: (errors) => {
    errosDeCampo(errors);
    if (opts.onError) opts.onError(errors);
  },
});

function createActions(current) {
  const optionsFor = (url, options = {}) => ({
    ...options, only: [...new Set([...writeReads(current.current, url), "errors", "flash"])],
    onSuccess: page => {
      window.dispatchEvent(new Event("psystem:read-refresh"));
      return options.onSuccess?.(page);
    },
  });
  function send(method, url, data, options) {
    const release = claimWrite(`${method}:${url}`);
    if (!release) return false;
    const original = optionsFor(url, options);
    const guarded = { ...original,
      onBefore: visit => { const result = original.onBefore?.(visit); if (result === false) release(); return result; },
      onSuccess: page => { release(); return original.onSuccess?.(page); },
      onError: errors => { release(); return original.onError?.(errors); },
      onCancel: () => { release(); return original.onCancel?.(); },
      onFinish: visit => { release(); return original.onFinish?.(visit); },
      onNetworkError: error => {
        release(); original.onNetworkError?.(error);
        erro("Não foi possível confirmar o envio. Suas edições foram preservadas. Confira os dados antes de tentar novamente.", "Falha de conexão");
        return false;
      },
      onHttpException: response => {
        release(); original.onHttpException?.(response);
        erro(`O servidor não confirmou esta ação (HTTP ${response.status}). Suas edições foram preservadas. Tente novamente.`, "Falha no envio");
        return false;
      },
    };
    try { return method === "delete" ? router.delete(url, guarded) : router[method](url, data, guarded); }
    catch (error) { release(); throw error; }
  }
  const visits = {
    post: (url, data, options) => send("post", url, data, options),
    put: (url, data, options) => send("put", url, data, options),
    patch: (url, data, options) => send("patch", url, data, options),
    delete: (url, options) => send("delete", url, undefined, options),
  };
  return {
  addPatient: (form, opts) => visits.post("/pacientes", form, feedback("Paciente cadastrado.", opts)),
  updatePatient: (id, form, opts) => visits.put(`/pacientes/${id}`, form, { ...keep, ...feedback("Cadastro atualizado.", opts) }),
  deletePatient: (id, opts) => visits.delete(`/pacientes/${id}`, { ...keep, ...feedback("Cadastro excluído.", opts) }),
  inactivatePatient: (id, opts) => visits.post(`/pacientes/${id}/inativar`, {}, { ...keep, ...feedback("Paciente inativado.", opts) }),
  updatePatientPhoto: (id, file) => visits.post(`/pacientes/${id}/foto`, { foto: file }, { ...withFiles, ...feedback("Foto atualizada.") }),
  setDiaVencimento: (id, dia, opts) => visits.patch(`/pacientes/${id}/vencimento`, { dia }, { ...keep, ...feedback("Dia de vencimento atualizado.", opts) }),

  saveMatricula: (patientId, form, opts) => visits.put(`/pacientes/${patientId}/matricula`, form, { ...keep, ...feedback("Matrícula salva.", opts) }),
  removeMatricula: (patientId, opts) => visits.delete(`/pacientes/${patientId}/matricula`, { ...keep, ...feedback("Matrícula encerrada.", opts) }),
  // Várias matrículas por paciente (rotas novas do backend: P13).
  addMatricula: (patientId, form, opts) => visits.post(`/pacientes/${patientId}/matriculas`, form, { ...keep, ...feedback("Matrícula criada.", opts) }),
  updateMatricula: (id, form, opts) => visits.put(`/matriculas/${id}`, form, { ...keep, ...feedback("Matrícula atualizada.", opts) }),
  deleteMatricula: (id, opts, dados = {}) => visits.delete(`/matriculas/${id}`, { data: dados, ...keep, ...feedback("Matrícula encerrada.", opts) }),

  saveRecord: (patientId, entry, opts) => (entry.id
    ? visits.put(`/prontuarios/${entry.id}`, entry, { ...keep, ...feedback("Prontuário atualizado.", opts) })
    : visits.post(`/pacientes/${patientId}/prontuarios`, entry, { ...keep, ...feedback("Prontuário salvo.", opts) })),

  deleteRecord: (id, opts) => visits.delete(`/prontuarios/${id}`, { ...keep, ...feedback("Prontuário excluído.", opts) }),

  // form = { id?, titulo, respostas }: com id edita aquela anamnese; sem id cria uma nova (as outras não mudam).
  saveAnamnese: (patientId, form, opts) => {
    const { id, ...dados } = form;
    return id
      ? visits.put(`/anamneses/${id}`, dados, { ...keep, ...feedback("Anamnese atualizada.", opts) })
      : visits.post(`/pacientes/${patientId}/anamneses`, dados, { ...keep, ...feedback("Anamnese salva.", opts) });
  },
  deleteAnamnese: (id, opts) => visits.delete(`/anamneses/${id}`, { ...keep, ...feedback("Anamnese excluída.", opts) }),

  addDocument: (patientId, doc, opts) => visits.post(`/pacientes/${patientId}/documentos`, doc, { ...withFiles, ...feedback("Documento anexado.", opts) }),
  removeDocument: (id, opts) => visits.delete(`/documentos/${id}`, { ...keep, ...feedback("Documento removido.", opts) }),

  addReceivable: (entry, opts) => visits.post("/cobrancas", entry, { ...keep, ...feedback("Cobrança criada.", opts) }),
  receiveReceivable: (id, payment, opts) => visits.post(`/cobrancas/${id}/pagamento`, payment, { ...keep, ...feedback("Recebimento registrado.", opts) }),
  reverseReceivablePayment: (id, pagamentoId, motivo, opts) => visits.post(`/cobrancas/${id}/pagamentos/${pagamentoId}/estorno`, { motivo }, { ...keep, ...feedback("Recebimento estornado.", opts) }),

  addPayable: (entry, opts) => visits.post("/despesas", entry, { ...keep, ...feedback("Despesa criada.", opts) }),
  payPayable: (id, payment, opts) => visits.post(`/despesas/${id}/pagamento`, payment, { ...keep, ...feedback("Pagamento registrado.", opts) }),
  reversePayablePayment: (id, pagamentoId, motivo, opts) => visits.post(`/despesas/${id}/pagamentos/${pagamentoId}/estorno`, { motivo }, { ...keep, ...feedback("Pagamento estornado.", opts) }),
  cancelReceivable: (id, opts) => visits.patch(`/cobrancas/${id}/cancelar`, {}, { ...keep, ...feedback("Lançamento cancelado.", opts) }),
  updateReceivable: (id, entry, opts) => visits.patch(`/cobrancas/${id}`, entry, { ...keep, ...feedback("Vencimento atualizado.", opts) }),
  updatePayable: (id, entry, opts) => visits.put(`/despesas/${id}`, entry, { ...keep, ...feedback("Conta atualizada.", opts) }),
  cancelPayable: (id, opts) => visits.delete(`/despesas/${id}`, { ...keep, ...feedback("Conta cancelada.", opts) }),
  stopRecurrence: (id, opts) => visits.delete(`/despesas/${id}/recorrencia`, { ...keep, ...feedback("Recorrência encerrada.", opts) }),

  addAppointment: (form, opts) => visits.post("/agenda", form, { ...keep, ...feedback("Consulta agendada.", opts) }),
  setAppointmentStatus: (id, status, opts) => visits.patch(`/agenda/${id}/status`, { status }, { ...keep, ...feedback("Status da consulta atualizado.", opts) }),

  saveSettings: (form, opts) => visits.put("/configuracoes", form, { ...keep, ...opts }),
  updateProfilePhoto: (file) => visits.post("/configuracoes/foto", { foto: file }, { ...withFiles, ...feedback("Foto atualizada.") }),

  logout: () => visits.post("/logout"),
};
}

export default function DataProvider({ children }) {
  const page = usePage(), current = useRef(page);
  current.current = page;
  const actions = useMemo(() => createActions(current), []);
  const { failure, retry } = usePageRefresh(current);
  const value = useMemo(() => ({ ...page.props, ...actions }), [page.props, actions]);
  return <DataContext.Provider value={value}>
    {failure && <div role="alert" style={{ padding: 12 }}>{failure} <button type="button" onClick={retry}>Tentar atualizar</button></div>}
    {children}
  </DataContext.Provider>;
}
