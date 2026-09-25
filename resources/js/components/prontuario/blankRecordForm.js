import { todayLabel } from "../../utils/date";

export function blankRecordForm() {
  return { sessao: "", date: todayLabel(), tecnicas: "", objetivo: "", descricao: "" };
}
