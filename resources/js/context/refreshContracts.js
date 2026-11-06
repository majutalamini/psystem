// Grupos de leitura que precisam mudar juntos. As demais props são reutilizadas
// somente após a gravação; foco/retorno do histórico renova a página visível.
export const PAGE_READS = {
  "Agenda/Agenda": ["events", "hours", "today", "limite", "selectedDate", "weekStart", "visao", "fullSlots", "agendaWindow"],
  "Pacientes/Pacientes": ["patientDirectory"],
  "Pacientes/PatientProfile": ["patientId", "patient", "hours", "enrollmentReservations", "simultaneousLimit", "records", "anamnese", "documents", "receivables"],
  "Prontuarios/Prontuarios": ["selectedId", "selectedPatient", "patientDirectory", "records", "recordCounts"],
  "Anamneses/Anamneses": ["selectedId", "selectedPatient", "patientDirectory", "anamnese", "anamneseCounts"],
  "Configuracoes/Configuracoes": ["auth", "horario", "goals", "enrollmentReservations"],
  "Financeiro/Financeiro": ["receivables", "payables", "financeSummary", "receivablePagination", "payablePagination"],
  "Relatorios/Relatorios": ["activeReport", "reportData"],
  "Dashboard/Dashboard": ["patientStats", "attentionPatients", "attentionTotal", "stats", "goals", "todayAppointments", "weekOverview", "weekLabel", "revenueData", "sessionsPerMonth", "pendenciasTotal", "pendencias"],
};

export function readsFor(page) {
  return (PAGE_READS[page.component] || []).filter(key => Object.hasOwn(page.props, key));
}

export function writeReads(page, url) {
  const reads = readsFor(page);
  // Os grupos pequenos das páginas de listas/agenda/configuração são atômicos.
  if (!["Pacientes/PatientProfile", "Prontuarios/Prontuarios", "Anamneses/Anamneses"].includes(page.component)) return reads;
  let affected;
  if (/\/prontuarios(?:\/|$)/.test(url)) affected = ["records", "recordCounts"];
  else if (/\/anamneses(?:\/|$)/.test(url)) affected = ["anamnese", "anamneseCounts"];
  else if (/\/documentos(?:\/|$)/.test(url)) affected = ["documents"];
  else if (/\/cobrancas(?:\/|$)/.test(url)) affected = ["receivables", "patient", "selectedPatient", "patientDirectory"];
  else affected = ["patientId", "patient", "selectedId", "selectedPatient", "patientDirectory", "hours", "enrollmentReservations", "simultaneousLimit", "receivables"];
  return reads.filter(key => affected.includes(key));
}
