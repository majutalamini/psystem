/* Lista de matrículas do paciente. Enquanto o servidor ainda manda uma só (patient.matricula), ela vira lista de um item. */
export function matriculasDe(patient) {
  if (!patient) return [];
  if (Array.isArray(patient.matriculas)) return patient.matriculas;
  return patient.matricula ? [patient.matricula] : [];
}

/* Matrículas que ainda valem (sem status = ativa). */
export function matriculasAtivas(patient) {
  return matriculasDe(patient).filter((m) => !m.status || m.status === "ativa");
}

/* O servidor já manda várias matrículas? Se não, a tela usa as rotas antigas (uma por paciente). */
export function suportaVariasMatriculas(patient) {
  return Array.isArray(patient.matriculas);
}
