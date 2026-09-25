/* Cada modelo aponta para o texto configurado em Configurações › WhatsApp. */
export const WA_TEMPLATES = [
  { key: "lembrete", label: "Lembrete de sessão", field: "lembrete" },
  { key: "retorno", label: "Lembrete de retorno", field: "retorno" },
  { key: "cobranca", label: "Cobrança de mensalidade", field: "cobranca" },
  { key: "livre", label: "Mensagem livre", field: null },
];

export const WA_VARIABLES = {
  lembrete: ["{paciente}", "{data}", "{hora}"],
  retorno: ["{paciente}", "{ultimaSessao}"],
  cobranca: ["{paciente}", "{referencia}", "{valor}", "{vencimento}"],
};

/* Valores de exemplo usados só na pré-visualização da mensagem. */
export const WA_SAMPLE = {
  "{paciente}": "Maria",
  "{data}": "19/08/2026",
  "{hora}": "09:00",
  "{ultimaSessao}": "22/06/2026",
  "{referencia}": "Agosto/2026",
  "{valor}": "R$ 800",
  "{vencimento}": "05/08/2026",
};
