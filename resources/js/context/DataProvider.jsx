import { useMemo } from "react";
import { router, usePage } from "@inertiajs/react";
import { DataContext } from "./DataContext";

/* Os dados vêm do Laravel (props do Inertia) e as ações viram requisições.
   As telas continuam usando useAppData() como antes. */
const keep = { preserveScroll: true };
const withFiles = { ...keep, forceFormData: true };

export const actions = {
  addPatient: (form, opts) => router.post("/pacientes", form, opts),
  updatePatient: (id, form, opts) => router.put(`/pacientes/${id}`, form, { ...keep, ...opts }),
  updatePatientPhoto: (id, file) => router.post(`/pacientes/${id}/foto`, { foto: file }, withFiles),

  saveMatricula: (patientId, form, opts) => router.put(`/pacientes/${patientId}/matricula`, form, { ...keep, ...opts }),
  removeMatricula: (patientId) => router.delete(`/pacientes/${patientId}/matricula`, keep),

  saveRecord: (patientId, entry, opts) => (entry.id
    ? router.put(`/prontuarios/${entry.id}`, entry, { ...keep, ...opts })
    : router.post(`/pacientes/${patientId}/prontuarios`, entry, { ...keep, ...opts })),

  saveAnamnese: (patientId, respostas, opts) => router.put(`/pacientes/${patientId}/anamnese`, { respostas }, { ...keep, ...opts }),

  addDocument: (patientId, doc, opts) => router.post(`/pacientes/${patientId}/documentos`, doc, { ...withFiles, ...opts }),
  removeDocument: (id) => router.delete(`/documentos/${id}`, keep),

  addReceivable: (entry, opts) => router.post("/cobrancas", entry, { ...keep, ...opts }),
  receiveReceivable: (id, payment, opts) => router.post(`/cobrancas/${id}/pagamento`, payment, { ...keep, ...opts }),
  reopenReceivable: (id) => router.delete(`/cobrancas/${id}/pagamento`, keep),

  addPayable: (entry, opts) => router.post("/despesas", entry, { ...keep, ...opts }),
  payPayable: (id, payment, opts) => router.post(`/despesas/${id}/pagamento`, payment, { ...keep, ...opts }),
  reopenPayable: (id) => router.delete(`/despesas/${id}/pagamento`, keep),

  addAppointment: (form, opts) => router.post("/agenda", form, { ...keep, ...opts }),
  setAppointmentStatus: (id, status, opts) => router.patch(`/agenda/${id}/status`, { status }, { ...keep, ...opts }),

  saveSettings: (form, opts) => router.put("/configuracoes", form, { ...keep, ...opts }),
  updateProfilePhoto: (file) => router.post("/configuracoes/foto", { foto: file }, withFiles),

  logout: () => router.post("/logout"),
};

export default function DataProvider({ children }) {
  const { props } = usePage();
  const value = useMemo(() => ({ ...props, ...actions }), [props]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
