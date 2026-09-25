import ReportAniversariantes from "./ReportAniversariantes";
import ReportComAnamnese from "./ReportComAnamnese";
import ReportComProntuario from "./ReportComProntuario";
import ReportContasPagar from "./ReportContasPagar";
import ReportContasReceber from "./ReportContasReceber";
import ReportFaixaEtaria from "./ReportFaixaEtaria";
import ReportFaltasCancelamentos from "./ReportFaltasCancelamentos";
import ReportFrequencia from "./ReportFrequencia";
import ReportGenero from "./ReportGenero";
import ReportInadimplencia from "./ReportInadimplencia";
import ReportInativosRisco from "./ReportInativosRisco";
import ReportListaPacientes from "./ReportListaPacientes";
import ReportNovosCadastros from "./ReportNovosCadastros";
import ReportOcupacao from "./ReportOcupacao";
import ReportRecebimentoPaciente from "./ReportRecebimentoPaciente";
import ReportSemAnamnese from "./ReportSemAnamnese";
import ReportSemProntuario from "./ReportSemProntuario";
import ReportSessoesRealizadasAgendadas from "./ReportSessoesRealizadasAgendadas";

export const REPORT_COMPONENTS = {
  lista: ReportListaPacientes,
  aniversariantes: ReportAniversariantes,
  inativos: ReportInativosRisco,
  novos: ReportNovosCadastros,
  "faixa-etaria": ReportFaixaEtaria,
  genero: ReportGenero,
  "realizadas-agendadas": ReportSessoesRealizadasAgendadas,
  "faltas-cancelamentos": ReportFaltasCancelamentos,
  frequencia: ReportFrequencia,
  ocupacao: ReportOcupacao,
  receber: ReportContasReceber,
  pagar: ReportContasPagar,
  inadimplencia: ReportInadimplencia,
  "recebimento-paciente": ReportRecebimentoPaciente,
  "com-anamnese": ReportComAnamnese,
  "sem-anamnese": ReportSemAnamnese,
  "com-prontuario": ReportComProntuario,
  "sem-prontuario": ReportSemProntuario,
};
