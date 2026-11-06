import { todayLabel } from "./date";

/* Texto simples de um arquivo .docx (lido no navegador; nada é enviado antes de o usuário confirmar). */
export async function lerDocx(file) {
  const { default: mammoth } = await import("mammoth/mammoth.browser");
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

const normalizar = (s) => String(s || "")
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const linhas = (texto) => texto.split("\n").map((l) => l.trim());

/* "02) Dados dos pais:" → "Dados dos pais" (tira a numeração do começo e os dois-pontos do fim). */
const semNumeracao = (s) => s.replace(/^\s*\d+\s*[).\-–]\s*/, "");
const limparTitulo = (s) => normalizar(semNumeracao(s).replace(/[:\s]+$/, ""));

/* Prontuário. Aceita o rótulo com valor na mesma linha ("Técnicas: ...") ou como título sozinho na linha
   ("TÉCNICAS UTILIZADAS", como no documento que o próprio sistema imprime), com o texto nas linhas seguintes. */
const ROTULOS_PRONTUARIO = [
  { campo: "tecnicas", re: /^tecnicas?( utilizadas?)?$/ },
  { campo: "objetivo", re: /^objetivos?( da sessao)?$/ },
  { campo: "descricao", re: /^(descricao|evolucao|relato|observacoes?)( da sessao| de atendimento)?( (relato|evolucao)( de atendimento| da sessao)?)?$/ },
];

const campoDoRotulo = (texto) => {
  const n = limparTitulo(texto);
  const achou = ROTULOS_PRONTUARIO.find((r) => r.re.test(n));
  return achou ? achou.campo : null;
};

const DATA_RE = /\b(\d{2}\/\d{2}\/\d{4})\b/;

/* Data do atendimento: "Sessão 1  01/08/2026" ou "Data: 01/08/2026". Datas de nascimento são ignoradas. */
function acharData(todas) {
  const limite = Math.min(todas.length, 60);
  let anterior = "";
  let candidata = "";
  for (let i = 0; i < limite; i += 1) {
    const l = todas[i];
    if (!l) continue;
    const m = l.match(DATA_RE);
    const nascimento = /nasc/i.test(l) || /nasc/i.test(anterior);
    if (m && !nascimento) {
      if (/sess[aã]o|^data\b|atendimento/i.test(l)) return m[1];
      if (!candidata) candidata = m[1];
    }
    anterior = l;
  }
  return candidata;
}

export function lerProntuario(texto) {
  const todas = linhas(texto);
  const data = acharData(todas);

  const campos = { tecnicas: [], objetivo: [], descricao: [] };
  const antes = [];
  let atual = null;
  let achouRotulo = false;

  todas.forEach((linha) => {
    if (!linha) { if (atual) campos[atual].push(""); return; }
    if (!atual && !achouRotulo && /sess[aã]o\s*\d*/i.test(linha) && DATA_RE.test(linha)) return; // linha "Sessão 1  01/08/2026"

    // Título sozinho na linha.
    const sozinho = campoDoRotulo(linha);
    if (sozinho) { atual = sozinho; achouRotulo = true; return; }

    // "Rótulo: valor" na mesma linha.
    const m = linha.match(/^(.{1,45}?)\s*[:\-–]\s*(.+)$/);
    const doRotulo = m ? campoDoRotulo(m[1]) : null;
    if (doRotulo) { atual = doRotulo; achouRotulo = true; campos[atual].push(m[2]); return; }

    if (atual) campos[atual].push(linha);
    else antes.push(linha);
  });

  const juntar = (arr) => arr.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  // Sem nenhum título reconhecido, o texto todo é a descrição. Com títulos, o que vem antes (cabeçalho, dados do paciente) é descartado.
  const descricao = achouRotulo ? juntar(campos.descricao) : [juntar(antes), juntar(campos.descricao)].filter(Boolean).join("\n\n");
  return { date: data || todayLabel(), tecnicas: juntar(campos.tecnicas), objetivo: juntar(campos.objetivo), descricao, dataEncontrada: Boolean(data) };
}

/* Palavras de ligação ignoradas ao comparar enunciados ("Profissional responsável pelo encaminhamento" ≈ "... do encaminhamento"). */
const LIGACAO = new Set(["de", "do", "da", "dos", "das", "pelo", "pela", "o", "a", "os", "as", "e", "em", "no", "na", "um", "uma"]);
const solta = (n) => n.split(" ").filter((w) => w && !LIGACAO.has(w)).join(" ");

/* Anamnese: encontra o enunciado de cada pergunta e pega a resposta. Reconhece
   - "Pergunta: resposta" e o enunciado sozinho com a resposta nas linhas seguintes;
   - várias perguntas na mesma linha ("Data de nascimento:   Idade: 5   Religião:");
   - títulos de seção numerados ("02) Dados de identificação dos pais:").
   Enunciados repetidos (ex.: "Escolaridade" em duas seções) são atribuídos na ordem, preferindo a seção em que o texto está. */
export function lerAnamnese(texto, secoes) {
  const titulos = new Map(secoes.map((s, i) => [normalizar(s.title), i]));
  const campos = [];
  secoes.forEach((s, i) => s.fields.forEach((f) => {
    const n = normalizar(f.label);
    // "Idade do pai" também responde por "Idade" quando o texto está na parte do pai (idem para a mãe).
    const dono = /(?:do pai|da mae)$/.exec(n);
    campos.push({ key: f.key, n, l: solta(n), secao: i, usado: false, base: dono ? n.slice(0, dono.index).trim() : null, dono: dono ? dono[0].slice(-3) : null });
  }));

  let dono = null; // "pai" ou "mae": de quem são os dados que o texto está descrevendo
  const ALIAS = { end: "endereco" };
  const casa = (c, n) => {
    n = ALIAS[n] || n;
    return c.n === n || (c.l && c.l === solta(n)) || Boolean(c.base && c.dono === dono && c.base === n);
  };
  const existe = (n) => Boolean(n) && campos.some((c) => !c.usado && casa(c, n));
  const pegar = (n, secao) => {
    const livres = campos.filter((c) => !c.usado && casa(c, n));
    const exatos = livres.filter((c) => c.n === (ALIAS[n] || n));
    const pool = exatos.length ? exatos : livres;
    const c = pool.find((x) => x.secao === secao) || pool[0];
    if (c) c.usado = true;
    return c;
  };

  /* Procura, no fim do trecho, um enunciado conhecido ("5 Religião" → valor "5", enunciado "Religião"). O mais longo vence. */
  const rotuloNoFim = (trecho) => {
    const palavras = trecho.trim().split(/\s+/).filter(Boolean);
    for (let ini = Math.max(0, palavras.length - 14); ini < palavras.length; ini += 1) {
      const candidato = normalizar(palavras.slice(ini).join(" "));
      if (existe(candidato)) return { antes: palavras.slice(0, ini).join(" "), n: candidato };
    }
    return null;
  };

  const respostas = {};
  const sobras = [];
  let secao = -1;
  let atual = null; // { key, partes }

  const abrir = (campo) => {
    if (/^nome do pai$/.test(campo.n)) dono = "pai";
    else if (/^nome da mae$/.test(campo.n)) dono = "mae";
    atual = { key: campo.key, partes: [] };
    respostas[campo.key] = atual.partes;
    return atual;
  };
  const gravar = (alvo, t) => {
    const v = (t || "").trim();
    if (!v) return;
    if (alvo) alvo.partes.push(v);
    else sobras.push(v);
  };

  linhas(texto).forEach((linha) => {
    if (!linha) { if (atual) atual.partes.push(""); return; }

    const nLinha = limparTitulo(linha);
    if (titulos.has(nLinha)) {
      secao = titulos.get(nLinha);
      dono = null;
      // Seção com o mesmo nome da pergunta ("Queixa principal"): o texto seguinte é a resposta.
      const campo = campos.find((c) => !c.usado && c.secao === secao && c.n === nLinha);
      if (campo) { campo.usado = true; atual = { key: campo.key, partes: [] }; respostas[campo.key] = atual.partes; } else atual = null;
      return;
    }

    const pecas = linha.split(":");
    if (pecas.length === 1) {
      // Enunciado sozinho; a resposta vem nas linhas seguintes.
      if (existe(nLinha)) abrir(pegar(nLinha, secao));
      else gravar(atual, linha);
      return;
    }

    const n0 = normalizar(semNumeracao(pecas[0]));
    let alvo = atual;
    let texto0 = null; // texto acumulado do alvo atual (null = acabou de abrir, sem texto)
    if (existe(n0)) {
      alvo = abrir(pegar(n0, secao));
    } else {
      texto0 = pecas[0];
    }

    for (let i = 1; i < pecas.length; i += 1) {
      const p = pecas[i];
      const ultimo = i === pecas.length - 1;
      const achou = ultimo ? null : rotuloNoFim(p);
      if (achou) {
        const valor = texto0 === null ? achou.antes : `${texto0}:${achou.antes}`;
        gravar(alvo, valor);
        alvo = abrir(pegar(achou.n, secao));
        texto0 = null;
      } else {
        texto0 = texto0 === null ? p : `${texto0}:${p}`;
      }
    }
    gravar(alvo, texto0);
    atual = alvo;
  });

  const final = {};
  Object.entries(respostas).forEach(([k, partes]) => {
    const t = partes.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (t) final[k] = t;
  });
  return { respostas: final, sobras: sobras.filter(Boolean).join("\n") };
}
