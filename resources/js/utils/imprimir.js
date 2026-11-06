import { erro } from "./alertas";
import { ageFromBrDate, todayLabel } from "./date";

const escapar = (texto) => String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const multilinha = (texto) => escapar(texto).replace(/\n/g, "<br>");

const ESTILO = `
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; color: #1C2233; font-size: 12.5pt; line-height: 1.6; margin: 0; }
  .topo { text-align: center; border-bottom: 2px solid #1C2233; padding-bottom: 10px; margin-bottom: 18px; }
  .topo .nome { font-size: 15pt; font-weight: 700; }
  .topo .crp { font-size: 11pt; color: #444; }
  h1 { font-size: 16pt; text-align: center; text-transform: uppercase; letter-spacing: .5px; margin: 0 0 16px; }
  h2 { font-size: 12pt; text-transform: uppercase; letter-spacing: .4px; background: #EEF0F6; padding: 5px 10px; margin: 20px 0 10px; break-after: avoid; }
  table.dados { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  table.dados td { border: 1px solid #999; padding: 5px 9px; font-size: 11.5pt; vertical-align: top; }
  table.dados td.rot { width: 28%; font-weight: 700; background: #F6F7FA; }
  .campo { margin-bottom: 10px; break-inside: avoid; }
  .campo .rot { font-size: 10pt; font-weight: 700; text-transform: uppercase; color: #555; }
  .registro { border: 1px solid #999; border-radius: 4px; padding: 12px 14px; margin-bottom: 14px; break-inside: avoid-page; }
  .registro .cab { display: flex; justify-content: space-between; font-weight: 700; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 8px; }
  table.lista { width: 100%; border-collapse: collapse; font-size: 10.5pt; }
  table.lista th { background: #EEF0F6; text-align: left; text-transform: uppercase; font-size: 9.5pt; }
  table.lista th, table.lista td { border: 1px solid #999; padding: 5px 8px; }
  .assinatura { margin-top: 56px; text-align: center; break-inside: avoid; }
  .assinatura .linha { border-top: 1px solid #1C2233; width: 280px; margin: 0 auto 4px; }
  .data { margin-top: 26px; font-size: 11pt; }
`;

/* Abre uma janela só com o documento e chama a impressão (o usuário também pode "Salvar como PDF"). */
export function imprimirDocumento(titulo, corpo) {
  const janela = window.open("", "_blank");
  if (!janela) {
    erro("O navegador bloqueou a janela de impressão. Libere os pop-ups deste site e tente de novo.");
    return;
  }
  janela.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapar(titulo)}</title><style>${ESTILO}</style></head><body>${corpo}</body></html>`);
  janela.document.close();
  janela.focus();
  setTimeout(() => janela.print(), 300);
}

const topo = (user) => `<div class="topo"><div class="nome">${escapar(user.nome)}</div><div class="crp">Psicóloga · CRP ${escapar(user.crp)}</div></div>`;

const rodape = (user) => `
  <div class="data">Criciúma, ${todayLabel()}.</div>
  <div class="assinatura"><div class="linha"></div><div><strong>${escapar(user.nome)}</strong></div><div>Psicóloga · CRP ${escapar(user.crp)}</div></div>`;

function dadosDoPaciente(patient) {
  const idade = ageFromBrDate(patient.nascimento);
  const linhas = [
    ["Paciente", patient.name],
    ["Data de nascimento", [patient.nascimento, idade != null ? `(${idade} anos)` : null].filter(Boolean).join(" ")],
    ["CPF", patient.cpf],
    ["Telefone", patient.phone],
  ];
  return `<table class="dados">${linhas.filter(([, v]) => v).map(([r, v]) => `<tr><td class="rot">${r}</td><td>${escapar(v)}</td></tr>`).join("")}</table>`;
}

const campo = (rotulo, texto) => (texto ? `<div class="campo"><div class="rot">${escapar(rotulo)}</div><div>${multilinha(texto)}</div></div>` : "");

/* Um ou mais registros do prontuário (ordem cronológica, da primeira à última sessão). */
export function imprimirProntuario(patient, registros, user) {
  const ordenados = [...registros].reverse();
  const corpo = `${topo(user)}<h1>Prontuário psicológico</h1>${dadosDoPaciente(patient)}
    ${ordenados.map((r) => `<div class="registro">
      <div class="cab"><span>${escapar(r.sessao || "Sessão")}</span><span>${escapar(r.date)}</span></div>
      ${campo("Técnicas utilizadas", r.tecnicas)}${campo("Objetivo da sessão", r.objetivo)}${campo("Descrição / relato de atendimento", r.descricao)}
    </div>`).join("")}
    ${rodape(user)}`;
  imprimirDocumento(`Prontuário — ${patient.name}`, corpo);
}

/* Anamnese preenchida: seções do modelo na mesma ordem do formulário, só com o que foi respondido. */
export function imprimirAnamnese(patient, anamnese, secoes, user) {
  const blocos = secoes
    .map((s) => ({ ...s, fields: s.fields.filter((f) => anamnese.respostas[f.key]) }))
    .filter((s) => s.fields.length > 0)
    .map((s) => `<h2>${escapar(s.title)}</h2>${s.fields.map((f) => campo(f.label, anamnese.respostas[f.key])).join("")}`)
    .join("");
  const corpo = `${topo(user)}<h1>${escapar(anamnese.titulo || "Anamnese")}</h1>${dadosDoPaciente(patient)}
    <div style="font-size:10.5pt;color:#555;margin-bottom:4px">Preenchida em ${escapar(anamnese.criadoEm)}</div>
    ${blocos}${rodape(user)}`;
  imprimirDocumento(`Anamnese — ${patient.name}`, corpo);
}

/* Declaração: título, texto, data e assinatura em uma só folha A4. */
export function imprimirDeclaracao(template, paragraphs, user) {
  const corpo = `<h1 style="margin-bottom:6px">${escapar(template.title)}</h1>
    <div style="width:60px;height:2px;background:#1C2233;margin:8px auto 26px"></div>
    ${paragraphs.map((p) => `<p style="text-align:justify;line-height:1.9;margin:0 0 14px">${escapar(p)}</p>`).join("")}
    ${rodape(user)}`;
  imprimirDocumento(template.title, corpo);
}

/* Tabela dos relatórios: colunas e linhas já em texto. */
export function imprimirTabela(titulo, colunas, linhas, user, resumo) {
  const corpo = `${topo(user)}<h1>${escapar(titulo)}</h1>
    ${resumo ? `<p>${escapar(resumo)}</p>` : ""}
    <table class="lista"><thead><tr>${colunas.map((c) => `<th>${escapar(c)}</th>`).join("")}</tr></thead>
    <tbody>${linhas.map((l) => `<tr>${l.map((c) => `<td>${escapar(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>
    <div class="data">Emitido em ${todayLabel()}.</div>`;
  imprimirDocumento(titulo, corpo);
}

/* CSV com ; e BOM: o Excel em português abre com acentos e colunas corretos. */
export function baixarCsv(nomeArquivo, colunas, linhas) {
  const celula = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const texto = [colunas, ...linhas].map((l) => l.map(celula).join(";")).join("\r\n");
  const blob = new Blob(["\ufeff", texto], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nomeArquivo.replace(/[^\w\-]+/g, "_")}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
