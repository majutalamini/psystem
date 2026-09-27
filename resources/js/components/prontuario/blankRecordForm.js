import { todayLabel } from "../../utils/date";

export function blankRecordForm() {
  return { date: todayLabel(), tecnicas: "", objetivo: "", descricao: "" };
}
