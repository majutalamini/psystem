import { useMemo } from "react";
import { router, usePage } from "@inertiajs/react";
import { erro, errosDeCampo, sucesso } from "../utils/alertas";
import { DataContext } from "./DataContext";

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

export const actions = {
  addPatient: (form, opts) => router.post("/pacientes", form, feedback("Paciente cadastrado.", opts)),
  updatePatient: (id, form, opts) => router.put(`/pacientes/${id}`, form, { ...keep, ...feedback("Cadastro atualizado.", opts) }),
  deletePatient: (id, opts) => router.delete(`/pacientes/${id}`, { ...keep, ...feedback("Cadastro excluído.", opts) }),
  updatePatientPhoto: (id, file) => router.post(`/pacientes/${id}/foto`, { foto: file }, { ...withFiles, ...feedback("Foto atualizada.") }),

  saveMatricula: (patientId, form, opts) => router.put(`/pacientes/${patientId}/matricula`, form, { ...keep, ...feedback("Matrícula salva.", opts) }),
  removeMatricula: (patientId, opts) => router.delete(`/pacientes/${patientId}/matricula`, { ...keep, ...feedback("Matrícula encerrada.", opts) }),
  // Várias matrículas por paciente (rotas novas do backend: P13).
  addMatricula: (patientId, form, opts) => router.post(`/pacientes/${patientId}/matriculas`, form, { ...keep, ...feedback("Matrícula criada.", opts) }),
  updateMatricula: (id, form, opts) => router.put(`/matriculas/${id}`, form, { ...keep, ...feedback("Matrícula atualizada.", opts) }),
  deleteMatricula: (id, opts) => router.delete(`/matriculas/${id}`, { ...keep, ...feedback("Matrícula encerrada.", opts) }),

  saveRecord: (patientId, entry, opts) => (entry.id
    ? router.put(`/prontuarios/${entry.id}`, entry, { ...keep, ...feedback("Prontuário atualizado.", opts) })
    : router.post(`/pacientes/${patientId}/prontuarios`, entry, { ...keep, ...feedback("Prontuário salvo.", opts) })),

  // form = { id?, titulo, respostas }: com id edita aquela anamnese; sem id cria uma nova (as outras não mudam).
  saveAnamnese: (patientId, form, opts) => {
    const { id, ...dados } = form;
    return id
      ? router.put(`/anamneses/${id}`, dados, { ...keep, ...feedback("Anamnese atualizada.", opts) })
      : router.post(`/pacientes/${patientId}/anamneses`, dados, { ...keep, ...feedback("Anamnese salva.", opts) });
  },
  deleteAnamnese: (id, opts) => router.delete(`/anamneses/${id}`, { ...keep, ...feedback("Anamnese excluída.", opts) }),

  addDocument: (patientId, doc, opts) => router.post(`/pacientes/${patientId}/documentos`, doc, { ...withFiles, ...feedback("Documento anexado.", opts) }),
  removeDocument: (id, opts) => router.delete(`/documentos/${id}`, { ...keep, ...feedback("Documento removido.", opts) }),

  addReceivable: (entry, opts) => router.post("/cobrancas", entry, { ...keep, ...feedback("Cobrança criada.", opts) }),
  receiveReceivable: (id, payment, opts) => router.post(`/cobrancas/${id}/pagamento`, payment, { ...keep, ...feedback("Recebimento registrado.", opts) }),
  reopenReceivable: (id, opts) => router.delete(`/cobrancas/${id}/pagamento`, { ...keep, ...feedback("Recebimento estornado.", opts) }),

  addPayable: (entry, opts) => router.post("/despesas", entry, { ...keep, ...feedback("Despesa criada.", opts) }),
  payPayable: (id, payment, opts) => router.post(`/despesas/${id}/pagamento`, payment, { ...keep, ...feedback("Pagamento registrado.", opts) }),
  reopenPayable: (id, opts) => router.delete(`/despesas/${id}/pagamento`, { ...keep, ...feedback("Pagamento estornado.", opts) }),

  addAppointment: (form, opts) => router.post("/agenda", form, { ...keep, ...feedback("Consulta agendada.", opts) }),
  setAppointmentStatus: (id, status, opts) => router.patch(`/agenda/${id}/status`, { status }, { ...keep, ...feedback("Status da consulta atualizado.", opts) }),

  saveSettings: (form, opts) => router.put("/configuracoes", form, { ...keep, ...opts }),
  updateProfilePhoto: (file) => router.post("/configuracoes/foto", { foto: file }, { ...withFiles, ...feedback("Foto atualizada.") }),
  testWhatsapp: (telefone, opts) => router.post("/configuracoes/whatsapp/teste", { telefone }, { ...keep, ...opts }),
  disconnectWhatsapp: () => router.post("/configuracoes/whatsapp/desconectar", {}, keep),
  sendWhatsapp: (mensagem, opts) => router.post("/whatsapp/enviar", mensagem, { ...keep, ...opts }),
  runWhatsappNow: (opts) => router.post("/configuracoes/whatsapp/enviar-agora", {}, { ...keep, ...opts }),

  logout: () => router.post("/logout"),
};

export default function DataProvider({ children }) {
  const { props } = usePage();
  const value = useMemo(() => ({ ...props, ...actions }), [props]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
