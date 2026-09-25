# Decisões do backend — Psystem

Stack: Laravel + Inertia (React) + PostgreSQL, rodando em Docker.
Base: `modelo_sistema_psicologia.sql`, ajustado conforme abaixo.

## Estrutura

- O projeto Laravel é criado dentro desta pasta (`psystem`). As telas atuais vão para `resources/js/Pages`.
- A navegação por `useState` no `App.jsx` vira rotas do Laravel. O `DataProvider` e os dados fixos de `src/data` saem; os dados chegam como props do Inertia.
- Docker Compose com três serviços: `app` (PHP), `db` (Postgres) e `node` (Vite).
- Login pela tabela `psicologos`, que vira o model de autenticação. Não existe tabela `users`.

## Agenda e matrícula

- Cada paciente tem uma matrícula: dia da semana, horário, modalidade e `valor_sessao`.
- Ao salvar a matrícula, o sistema cria as consultas das próximas **4 semanas** na tabela `agenda`. Um comando diário completa a janela.
- Ao mudar a matrícula, as consultas futuras com status `agendado` são apagadas e geradas de novo. Ao inativar o paciente, as futuras `agendado` são apagadas.
- Não pode haver duas consultas no mesmo horário.
- Status do front → banco: "Pendente" = `agendado`, "Confirmado" = `confirmado`.
- `agenda.modalidade` (presencial/online) é copiada da matrícula. `tipos_consulta` e `agenda.tipo_consulta_id` saem, porque nada no front usa.

## Financeiro

- **Cobrança por sessão.** Quando a consulta vira `realizado`, nasce uma cobrança `pendente` com `agenda_id`, o valor da matrícula e vencimento na data da sessão. Se o status sair de `realizado`, a cobrança pendente é cancelada.
- Lançamento manual de cobrança continua existindo (`agenda_id` nulo).
- "Atrasado" não é gravado: é `pendente` com vencimento no passado.
- A baixa cria uma linha em `pagamentos`; o estorno apaga essa linha e a cobrança volta a `pendente`.
- Textos do front que falam em "Mensalidade" passam a falar em sessão.

## Prontuário

- Novas colunas `tecnicas` e `objetivo`. A descrição vai em `observacoes_consulta`.
- "Sessão N" é calculado (posição do registro), não gravado.

## Anamnese

- Uma anamnese por paciente. Editar sobrescreve as respostas.
- O formulário de `src/data/anamnese.js` vira um modelo com perguntas via seeder.

## Tabelas e colunas novas

| Tabela | Conteúdo |
|---|---|
| `pacientes` | + `convenio`, `endereco` (rua, número, bairro) |
| `matriculas` | + `valor_sessao`; uma por paciente |
| `agenda` | + `modalidade`; − `tipo_consulta_id` |
| `prontuarios` | + `tecnicas`, `objetivo` |
| `despesas` | contas a pagar: descrição, categoria, valor, vencimento, pago_em |
| `documentos` | arquivos do paciente: nome, caminho no storage, tamanho, data |
| `configuracoes` | uma linha só: metas, textos do WhatsApp, expediente (dias, início, fim, duração padrão) |

## Fica como está

- Declarações são geradas na hora e não são salvas.
- Relatórios e Dashboard são consultas em cima das tabelas acima, sem tabela própria.
