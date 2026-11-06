import { lazy } from "react";

export const REPORT_COMPONENTS = {
  lista: lazy(() => import("./ReportListaPacientes")),
  aniversariantes: lazy(() => import("./ReportAniversariantes")),
  inativos: lazy(() => import("./ReportInativosRisco")),
  novos: lazy(() => import("./ReportNovosCadastros")),
  "faixa-etaria": lazy(() => import("./ReportFaixaEtaria")),
  genero: lazy(() => import("./ReportGenero")),
  "realizadas-agendadas": lazy(() => import("./ReportSessoesRealizadasAgendadas")),
  "faltas-cancelamentos": lazy(() => import("./ReportFaltasCancelamentos")),
  frequencia: lazy(() => import("./ReportFrequencia")),
  ocupacao: lazy(() => import("./ReportOcupacao")),
  receber: lazy(() => import("./ReportContasReceber")),
  pagar: lazy(() => import("./ReportContasPagar")),
  inadimplencia: lazy(() => import("./ReportInadimplencia")),
  "recebimento-paciente": lazy(() => import("./ReportRecebimentoPaciente")),
  "com-anamnese": lazy(() => import("./ReportComAnamnese")),
  "sem-anamnese": lazy(() => import("./ReportSemAnamnese")),
  "com-prontuario": lazy(() => import("./ReportComProntuario")),
  "sem-prontuario": lazy(() => import("./ReportSemProntuario")),
};
