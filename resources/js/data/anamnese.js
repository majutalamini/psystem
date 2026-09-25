/* Anamnese — Acolhimento Infantil (todas as perguntas do formulário) */
export const ANAMNESE_SECTIONS = [
  {
    title: "Dados de identificação",
    fields: [
      { key: "nome", label: "Nome" },
      { key: "dataNascimentoCrianca", label: "Data de nascimento" },
      { key: "idadeCrianca", label: "Idade" },
      { key: "religiao", label: "Religião" },
      { key: "cidade", label: "Cidade" },
      { key: "estado", label: "Estado" },
      { key: "enderecoCrianca", label: "Endereço" },
      { key: "estadoCivil", label: "Estado civil" },
      { key: "sexo", label: "Sexo" },
      { key: "escolaridade", label: "Escolaridade" },
      { key: "telefoneFixo", label: "Telefone fixo" },
      { key: "celular", label: "Celular" },
      { key: "recado", label: "Recado" },
      { key: "encaminhamento", label: "Encaminhamento", textarea: true },
      { key: "profissionalEncaminhamento", label: "Profissional responsável pelo encaminhamento" },
      { key: "buscaIndependente", label: "Busca independente (Sim/Não) — Recomendação" },
    ],
  },
  {
    title: "Dados de identificação dos pais",
    fields: [
      { key: "nomePai", label: "Nome do pai" },
      { key: "idadePai", label: "Idade do pai" },
      { key: "profissaoPai", label: "Profissão do pai" },
      { key: "empresaPai", label: "Empresa do pai" },
      { key: "escolaridadePais", label: "Escolaridade" },
      { key: "nomeMae", label: "Nome da mãe" },
      { key: "idadeMae", label: "Idade da mãe" },
      { key: "profissaoMae", label: "Profissão da mãe" },
      { key: "empresaMae", label: "Empresa da mãe" },
      { key: "enderecoPais", label: "Endereço" },
    ],
  },
  {
    title: "Queixa principal",
    fields: [
      { key: "queixaPrincipal", label: "Queixa principal", textarea: true },
    ],
  },
  {
    title: "História clínica",
    fields: [
      { key: "doencaCronica", label: "Doença crônica (Sim/Não) — Quais" },
      { key: "laudoDiagnostico", label: "Laudo/Diagnóstico" },
      { key: "cid", label: "CID" },
      { key: "tempoDiagnostico", label: "Há quanto tempo recebeu o diagnóstico" },
      { key: "primeirosSinais", label: "Primeiros sinais que apresentou", textarea: true },
      { key: "quemPercebeuSinais", label: "Quem percebeu os sinais (Família/Escola/Outros)" },
      { key: "relateSobre", label: "Relate sobre", textarea: true },
    ],
  },
  {
    title: "Medicamentos e intervenções",
    fields: [
      { key: "usoMedicamentos", label: "Uso de medicamentos (Sim/Não) — Quais" },
      { key: "quantoTempoMedicamento", label: "Quanto tempo" },
      { key: "casosInternacao", label: "Casos de internação" },
      { key: "motivoInternacao", label: "Motivo" },
      { key: "limitacoes", label: "Limitações (auditiva, visual, motora, fala, outra)" },
      { key: "psicoterapiaPsiquiatra", label: "Psicoterapia / Psiquiatra / Neurologista" },
      { key: "outrosEspecialistas", label: "Já procurou outros especialistas? Quais?" },
      { key: "tratamentoAtual", label: "Está fazendo tratamento médico, psicológico, psiquiátrico ou neurológico?" },
      { key: "porque", label: "Por quê?" },
      { key: "convulsoes", label: "A criança tem/teve convulsões (com ou sem febre)?" },
      { key: "traumatismo", label: "Já teve traumatismo?" },
      { key: "cirurgia", label: "Já realizou alguma cirurgia? Qual?" },
    ],
  },
  {
    title: "Período gestacional e pós-parto",
    fields: [
      { key: "problemasGestacao", label: "Problemas de saúde na gestação", textarea: true },
      { key: "condicoesEmocionais", label: "Condições emocionais na gestação e pós-parto", textarea: true },
      { key: "eventosGestacao", label: "Eventos significativos neste período", textarea: true },
    ],
  },
  {
    title: "Dados do nascimento",
    fields: [
      { key: "peso", label: "Peso" },
      { key: "centimetros", label: "Centímetros" },
      { key: "apgar", label: "Apgar" },
      { key: "coloracao", label: "Coloração" },
      { key: "problemasPosParto", label: "Relate se houve problemas pós-parto", textarea: true },
    ],
  },
  {
    title: "Comunicação",
    fields: [
      { key: "comunicacaoAtual", label: "Comunicação atual (se fala, quantas palavras, atraso na linguagem, primeiras vocalizações, etc.)", textarea: true },
      { key: "balbucios", label: "Balbucios" },
      { key: "ecolalias", label: "Presença de ecolalias (Sim/Não) — Outros/quais" },
    ],
  },
  {
    title: "Motricidade",
    fields: [
      { key: "sentar", label: "Sentar" },
      { key: "engatinhar", label: "Engatinhar" },
      { key: "andar", label: "Andar" },
      { key: "pontaPes", label: "Caminhar na ponta dos pés (Sim/Não) — Quanto tempo" },
    ],
  },
  {
    title: "Alimentação",
    fields: [
      { key: "amamentacao", label: "Amamentação (Sim/Não) — Quanto tempo" },
      { key: "mamadeiras", label: "Mamadeiras (Sim/Não) — Quanto tempo" },
      { key: "forcadaAlimentar", label: "A criança é forçada a se alimentar? Explique", textarea: true },
      { key: "seletividadeAlimentar", label: "Seletividade alimentar (texturas, gosto, cor, temperatura, outros)", textarea: true },
      { key: "ajudaAlimentacao", label: "Recebe ajuda na alimentação?" },
    ],
  },
  {
    title: "Sono",
    fields: [
      { key: "dormeBem", label: "A criança dorme bem?" },
      { key: "comoSono", label: "Como é seu sono (agitado, tranquilo)" },
      { key: "rangeDentes", label: "Range os dentes ao dormir?" },
      { key: "quartoSeparado", label: "Dorme em quarto separado dos pais?" },
    ],
  },
  {
    title: "Autonomia",
    fields: [
      { key: "vesteSozinho", label: "Veste-se sozinho?" },
      { key: "banhoSozinho", label: "Toma banho sozinho?" },
      { key: "controleEsfincteres", label: "Controle de esfíncteres" },
      { key: "fraldas", label: "Fez ou faz uso de fraldas? Quanto tempo" },
      { key: "desfralde", label: "Como foi o desfralde" },
      { key: "chupetas", label: "Chupetas — quanto tempo" },
      { key: "retiradaChupeta", label: "Como foi a retirada" },
    ],
  },
  {
    title: "História familiar",
    fields: [
      { key: "dinamicaFamiliar", label: "Dinâmica familiar", textarea: true },
      { key: "relacaoPais", label: "Relação com os pais", textarea: true },
      { key: "relacaoIrmaos", label: "Relação com irmãos", textarea: true },
      { key: "transtornosFamilia", label: "Presença de transtornos e/ou deficiências na família", textarea: true },
    ],
  },
  {
    title: "História social",
    fields: [
      { key: "brincarSozinhaAmigos", label: "Prefere brincar sozinha(o) ou com amigos?" },
      { key: "descrevaBrincar", label: "Descreva o brincar do seu filho(a)", textarea: true },
      { key: "amigosFacilidade", label: "Faz amigos com facilidade?" },
      { key: "adaptaMeio", label: "Adapta-se facilmente ao meio?" },
      { key: "escolaSocializacao", label: "Escola (socialização)", textarea: true },
      { key: "rotinaCrianca", label: "Rotina da criança (atividades extras, etc.)", textarea: true },
    ],
  },
  {
    title: "Dados escolares",
    fields: [
      { key: "dadosEscola", label: "Dados da escola (ano de inserção, período, queixas, dificuldades, etc.)", textarea: true },
      { key: "gostaEscola", label: "A criança gosta de ir à escola?" },
      { key: "aceitaAmigos", label: "É bem aceita pelos amigos ou é isolada?" },
      { key: "reprovacaoDificuldades", label: "Casos de reprovação / áreas de dificuldades", textarea: true },
    ],
  },
  {
    title: "Comportamento",
    fields: [
      { key: "caracteristicasComportamento", label: "Características predominantes (agressiva, passiva, dependente, independente, inquieta, medrosa, retraída, desligada, excitada, outros)", textarea: true },
      { key: "reageContrariada", label: "Como reage quando contrariada?" },
      { key: "eventosSignificativos", label: "Eventos significativos", textarea: true },
      { key: "autoagressao", label: "Autoagressão — quais e comportamento que antecede o ocorrido", textarea: true },
      { key: "heteroagressao", label: "Heteroagressão — quais e comportamento que antecede o ocorrido", textarea: true },
      { key: "comportamentosDestrutivos", label: "Comportamentos destrutivos — quais e comportamento que antecede o ocorrido", textarea: true },
      { key: "movimentosEstereotipados", label: "Movimentos estereotipados (flap de mãos, balanço, etc.) — quais" },
      { key: "alinhamentoEmpilhamento", label: "Alinhamento / empilhamento / gosta de objetos que rodam ou piscam" },
      { key: "outrosComportamentos", label: "Outros" },
    ],
  },
  {
    title: "Medidas disciplinares",
    fields: [
      { key: "medidasDisciplinares", label: "Quais as medidas disciplinares normalmente utilizadas com a criança?", textarea: true },
      { key: "quemUsaMedidas", label: "Quem as usa?" },
      { key: "reacaoMedidas", label: "Quais as reações da criança frente a essas medidas?", textarea: true },
    ],
  },
  {
    title: "Preferências e reforços",
    fields: [
      { key: "atividadesPreferidas", label: "Atividades / brinquedos preferidos", textarea: true },
    ],
  },
];

export const ANAMNESE_FIELDS = ANAMNESE_SECTIONS.flatMap((s) => s.fields);
