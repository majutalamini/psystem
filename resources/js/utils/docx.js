import mammoth from "mammoth/mammoth.browser";
import { todayLabel } from "./date";

/* Texto simples de um arquivo .docx (lido no navegador; nada é enviado antes de o usuário confirmar). */
export async function lerDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

const normalizar = (s) => String(s || "")
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const linhas = (texto) => texto.split("\n").map((l) => l.trim());

/* Prontuário: reconhece "Data", "Técnicas", "Objetivo" e "Descrição/Evolução/Relato"; o que não tiver rótulo vira descrição. */
const ROTULOS_PRONTUARIO = [
  { campo: "tecnicas", re: /^t[eé]cnicas?\s*(?:utilizadas?)?\s*[:\-–]\s*(.*)$/i },
  { campo: "objetivo", re: /^objetivos?\s*(?:da\s+sess[aã]o)?\s*[:\-–]\s*(.*)$/i },
  { campo: "descricao", re: /^(?:descri[cç][aã]o|evolu[cç][aã]o|relato|observa[cç][oõ]es?)\s*(?:da\s+sess[aã]o)?\s*[:\-–]\s*(.*)$/i },
];

export function lerProntuario(texto) {
  const todas = linhas(texto);
  let data = "";
  const dataRe = /\b(\d{2}\/\d{2}\/\d{4})\b/;
  const idxData = todas.slice(0, 10).findIndex((l) => dataRe.test(l));
  if (idxData >= 0) data = todas[idxData].match(dataRe)[1];

  const campos = { tecnicas: [], objetivo: [], descricao: [] };
  const antes = [];
  let atual = null;
  todas.forEach((linha, i) => {
    if (i === idxData && /^(?:data\b.*?)?[:\s]*\d{2}\/\d{2}\/\d{4}\s*$/i.test(linha)) return; // linha só com a data
    const achou = ROTULOS_PRONTUARIO.map((r) => ({ campo: r.campo, m: linha.match(r.re) })).find((x) => x.m);
    if (achou) {
      atual = achou.campo;
      if (achou.m[1]) campos[atual].push(achou.m[1]);
    } else if (atual) campos[atual].push(linha);
    else antes.push(linha);
  });

  const juntar = (arr) => arr.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const descricao = [juntar(antes), juntar(campos.descricao)].filter(Boolean).join("\n\n");
  return { date: data || todayLabel(), tecnicas: juntar(campos.tecnicas), objetivo: juntar(campos.objetivo), descricao, dataEncontrada: Boolean(data) };
}

/* Anamnese: procura no texto o enunciado de cada pergunta ("Pergunta: resposta" ou o enunciado numa linha e a resposta nas seguintes).
   Enunciados repetidos (ex.: "Escolaridade" em duas seções) são atribuídos na ordem em que aparecem. */
export function lerAnamnese(texto, secoes) {
  const filas = new Map();
  const titulos = new Set(secoes.map((s) => normalizar(s.title)));
  secoes.forEach((s) => s.fields.forEach((f) => {
    const n = normalizar(f.label);
    if (!filas.has(n)) filas.set(n, []);
    filas.get(n).push(f.key);
  }));

  const respostas = {};
  const sobras = [];
  let atual = null;

  linhas(texto).forEach((linha) => {
    if (!linha) { if (atual) atual.partes.push(""); return; }
    if (titulos.has(normalizar(linha))) { atual = null; return; }

    const i = linha.indexOf(":");
    const cabeca = normalizar(i >= 0 ? linha.slice(0, i) : linha);
    const fila = filas.get(cabeca);
    if (fila && fila.length && (i >= 0 || cabeca === normalizar(linha))) {
      atual = { key: fila.shift(), partes: [i >= 0 ? linha.slice(i + 1).trim() : ""] };
      respostas[atual.key] = atual.partes;
    } else if (atual) atual.partes.push(linha);
    else sobras.push(linha);
  });

  const final = {};
  Object.entries(respostas).forEach(([k, partes]) => {
    const t = partes.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (t) final[k] = t;
  });
  return { respostas: final, sobras: sobras.filter(Boolean).join("\n") };
}
