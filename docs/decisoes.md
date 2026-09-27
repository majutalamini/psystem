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
- Excluir a matrícula (com confirmação na tela) apaga as futuras `agendado` e deixa o paciente inativo. As consultas já confirmadas, o histórico e as cobranças continuam.
- Não pode haver duas consultas no mesmo horário.
- Status do front → banco: "Pendente" = `agendado`, "Confirmado" = `confirmado`.
- `agenda.modalidade` (presencial/online) é copiada da matrícula. `tipos_consulta` e `agenda.tipo_consulta_id` saem, porque nada no front usa.

## Financeiro

- **Cobrança por sessão.** Quando a consulta vira `realizado`, nasce uma cobrança `pendente` com `agenda_id`, o valor da matrícula e vencimento na data da sessão. Se o status sair de `realizado`, a cobrança pendente é cancelada.
- Lançamento manual de cobrança continua existindo (`agenda_id` nulo).
- "Atrasado" não é gravado: é `pendente` com vencimento no passado.
- A baixa cria uma linha em `pagamentos`. A cobrança pode ser recebida **em partes**: ela só vira `pago` quando a soma dos pagamentos chega ao valor; antes disso continua `pendente`, com o restante em `saldo`. Não se aceita receber mais do que o saldo.
- O estorno apaga o **último** pagamento e a cobrança volta a `pendente`.
- Ao sair de "realizado", só é cancelada a cobrança sem nenhum pagamento; uma recebida em parte fica como está.
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
| `pacientes` | + `endereco` (rua, número, bairro) |
| `matriculas` | + `valor_sessao`; uma por paciente |
| `agenda` | + `modalidade`; − `tipo_consulta_id` |
| `prontuarios` | + `tecnicas`, `objetivo` |
| `despesas` | contas a pagar: descrição, categoria, valor, vencimento, pago_em |
| `documentos` | arquivos do paciente: nome, caminho no storage, tamanho, data |
| `configuracoes` | uma linha só: metas, textos do WhatsApp, expediente (dias, início, fim, duração padrão) |

## Fica como está

- Declarações são geradas na hora e não são salvas.
- Relatórios e Dashboard são consultas em cima das tabelas acima, sem tabela própria.

## Decisões tomadas durante a implementação

- `pacientes.foto` e `psicologos.foto`: o front permite trocar a foto de ambos. `psicologos.remember_token` é exigido pelo "manter conectado" do Laravel.
- `agenda.matricula_id` (opcional): identifica as consultas geradas pela matrícula, para que só elas sejam apagadas ou refeitas.
- Índice único parcial `agenda (data_hora_consulta) WHERE status <> 'cancelado'` para impedir duas consultas no mesmo horário.
- Consulta realizada de paciente sem matrícula **não gera cobrança**, porque não há valor de sessão definido.
- A Agenda ganha botões para marcar a consulta como "realizado" e "falta". O front original só confirmava e cancelava, e a cobrança depende do "realizado".
- Consulta cancelada continua gravada com status `cancelado` e some da agenda. Ela aparece nos relatórios de faltas e cancelamentos.
- Os modais de nova cobrança e nova despesa não têm mais o campo "Status". Tudo nasce em aberto, e a baixa é feita pelos botões Receber/Pagar.
- Anamnese: as perguntas ficam em `anamnese_perguntas`, todas com `tipo_pergunta = 'texto_livre'`. O `resources/js/data/anamnese.js` passa a servir só para o front saber quais perguntas usam caixa de texto grande (busca pelo rótulo).
- CPF e data de nascimento são obrigatórios (regra do banco), e o formulário mostra o erro. O cadastro ganhou os campos sexo, cidade, UF e contato de emergência, que o banco tem e o formulário não tinha.
- Os horários da agenda são as horas cheias do expediente configurado (08:00–18:00 → 08:00 … 17:00).
- Para agendar só aparecem horários livres: sem consulta marcada e que ainda não passaram (o servidor também recusa horário passado). Na matrícula, some o horário que já é da matrícula de outro paciente ativo no mesmo dia da semana.
- A autenticação em duas etapas sai da tela de Segurança, porque não foi implementada.
- A semana começa na segunda. Use sempre `startOfWeek(Carbon::MONDAY)`, porque o locale pt_BR do Carbon começa no domingo.
- O fuso é `America/Sao_Paulo`, tanto em `config/app.php` quanto na conexão `pgsql` de `config/database.php`.
- O Dashboard recebe `pendenciasTotal` (todas as cobranças em aberto), porque `pendencias` traz só as quatro que vencem primeiro.
- A mensagem padrão de cobrança do WhatsApp (seeder) virou "A cobrança referente a {referencia}…", já que `{referencia}` agora é "Sessão — dd/mm/aaaa".
- Declarações: "Em acompanhamento desde" e "Valor recebido" vêm preenchidos com a matrícula do paciente (ou a data de cadastro). O nome e o CRP saem de `auth.user`. A cidade ("Criciúma") continua fixa, porque não há campo para ela.
- Agenda: uma consulta fora do expediente atual (expediente alterado depois) continua aparecendo na lista de horários. Consulta com falta aparece esmaecida.
- Configurações: a foto é enviada na hora, sem esperar o "Salvar alterações". O botão de testar mensagem do WhatsApp usa os textos ainda não salvos.
- O relatório "Pacientes com anamnese" perdeu a coluna "Nº de anamneses", porque agora existe uma só por paciente.
- Sem convênio: a psicóloga não atende por convênio. A coluna `pacientes.convenio` sai (migration `2026_09_27_000000_remove_convenio_from_pacientes`) e "Convênio" deixa de ser forma de pagamento. O valor `convenio` continua aceito na coluna `metodo_pagamento` do banco só para não quebrar registros antigos.
- Despesas continuam com baixa única (`pago_em`, `valor_pago`): pagar uma despesa, mesmo com valor menor, a marca como paga.

## Estado da implementação (para continuar)

### Ambiente

- Máquina atual (Linux): há Node 24, npm, git e python3. **Não há PHP, Composer nem Docker**, então o backend e os testes ainda não foram executados.
- A pasta `psystem` é um repositório git (origin `majutalamini/psystem`). O front original está no commit `a5f07b6`.

### Como subir (em uma máquina com Docker)

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec app composer install
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed
docker compose exec app php artisan storage:link
docker compose exec app php artisan db:seed --class=ExemploSeeder   # opcional: pacientes de exemplo
docker compose exec app php artisan test
```

Acesse http://localhost:8000 com o login `isadora.talamini@psystem.com` e a senha `psystem123`. O serviço `scheduler` roda `agenda:gerar` todo dia à 01:00.

### Backend: pronto, nunca executado

- `database/migrations/0001_01_01_000000_create_psystem_tables.php`: todas as tabelas numa migration só, espelhando o SQL.
- Models em `app/Models`. A tabela `agenda` é o model `Consulta`. Cada model tem um `paraTela()` que devolve o formato que o front usa (datas `dd/mm/aaaa`, `name`, `phone`, `status` "Ativo" etc.). As conversões ficam em `app/Support/Tela.php`.
- Regras de negócio: `app/Services/AgendaMatricula.php` (`gerar()` e `limparFuturas()`), `Consulta::alterarStatus()` (cria, reativa ou cancela a cobrança da sessão) e `FinanceiroController` (baixa e estorno).
- Props compartilhadas em `app/Http/Middleware/HandleInertiaRequests.php`: `auth.user`, `patients` (todos, com resumo de sessões, matrícula e `cobrancaPendente`), `whatsapp`, `hours` e `flash.aviso`.
- Seeders: `DatabaseSeeder` (psicóloga, configurações e modelo de anamnese) e `ExemploSeeder`.
- Testes em `tests/Feature` (SQLite em memória, relógio parado em segunda, 28/09/2026 às 10:00):
  - `AgendaMatriculaTest`: geração das 4 semanas, horário passado, horário ocupado, troca e remoção da matrícula, inativar/reativar, comando diário, cancelada que não volta, agendamento manual em horário ocupado.
  - `CobrancaSessaoTest`: cobrança ao marcar "realizado", cancelada ao desmarcar, reativada ao remarcar, paga que não é mexida, paciente sem matrícula, "Atrasado".
  - `FinanceiroTest`: lançamento manual, baixa (total e parcial) e estorno de cobrança e de despesa.
  - `TelasTest`: login e todas as telas abrindo com os dois seeders; anamnese e configurações.

### Front: pronto

- Todas as telas usam as props do Inertia. `useAppData()` junta as props da página (`usePage().props`) com as ações de `context/DataProvider.jsx`, que chamam `router.post/put/patch/delete`. Para fechar um modal só quando der certo, use `{ onSuccess: () => fechar() }`. No Inertia 3 essas chamadas preservam o estado da página por padrão, então um erro de validação mantém o modal aberto.
- Os erros de validação chegam em `useAppData().errors[campo]`. O `FormField` aceita `error`; `ErrorText` serve para inputs soltos.
- A navegação usa `navigate("pagina", query?)` de `utils/nav.js`. O layout persistente (`AppLayout`) é aplicado em `app.jsx` pela opção `layout`; as telas em `Auth/` ficam sem layout.
- `npm run build` passa sem erros. Cada tela, aba, modal e relatório foi renderizado no Node com props no formato dos `paraTela()`, sem erros.

### Falta

1. Rodar `php artisan test` numa máquina com PHP ou Docker e corrigir o que falhar (inclui conferir a sintaxe do PHP, que nunca rodou).
2. Testar no navegador os fluxos principais: cadastro de paciente, matrícula, agenda (confirmar, realizado, falta, cancelar), cobrança e estorno, documentos, anamnese, configurações e impressão de declaração.
3. Commitar.
