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

## Decisões tomadas durante a implementação

- `pacientes.foto` e `psicologos.foto`: o front permite trocar a foto de ambos. `psicologos.remember_token` é exigido pelo "manter conectado" do Laravel.
- `agenda.matricula_id` (opcional): identifica as consultas geradas pela matrícula, para que só elas sejam apagadas ou refeitas.
- Índice único parcial `agenda (data_hora_consulta) WHERE status <> 'cancelado'` para impedir duas consultas no mesmo horário.
- Consulta realizada de paciente sem matrícula **não gera cobrança**, porque não há valor de sessão definido.
- A Agenda ganha botões para marcar a consulta como "realizado" e "falta". O front original só confirmava e cancelava, e a cobrança depende do "realizado".
- Consulta cancelada continua gravada com status `cancelado` e some da agenda. Ela aparece nos relatórios de faltas e cancelamentos.
- Os modais de nova cobrança e nova despesa não têm mais o campo "Status". Tudo nasce em aberto, e a baixa é feita pelos botões Receber/Pagar.
- Anamnese: as perguntas ficam em `anamnese_perguntas`, todas com `tipo_pergunta = 'texto_livre'`. O `resources/js/data/anamnese.js` passa a servir só para o front saber quais perguntas usam caixa de texto grande (busca pelo rótulo).
- CPF e data de nascimento são obrigatórios (regra do banco), e o formulário mostra o erro. O cadastro ganhou os campos sexo, convênio, cidade, UF e contato de emergência, que o banco tem e o formulário não tinha.
- Os horários da agenda são as horas cheias do expediente configurado (08:00–18:00 → 08:00 … 17:00).
- A autenticação em duas etapas sai da tela de Segurança, porque não foi implementada.
- A semana começa na segunda. Use sempre `startOfWeek(Carbon::MONDAY)`, porque o locale pt_BR do Carbon começa no domingo.
- O fuso é `America/Sao_Paulo`, tanto em `config/app.php` quanto na conexão `pgsql` de `config/database.php`.

## Estado da implementação (para continuar)

### Ambiente desta máquina

- Não há PHP nem Docker funcionando, e o PowerShell está bloqueado por política de grupo. Executáveis baixados para Temp ou Downloads também são bloqueados. Só Node 24, npm e git funcionam.
- O `curl` precisa de `--ssl-no-revoke`. O comando `python` trava (é o alias da Microsoft Store). Para scripts, use `node`.
- A pasta `psystem` é um repositório git (origin `majutalamini/psystem`). **Nada foi commitado.** O front original está no commit `a5f07b6`.

### Como subir (em uma máquina com Docker)

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec app composer install
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed
docker compose exec app php artisan storage:link
docker compose exec app php artisan db:seed --class=ExemploSeeder   # opcional: pacientes de exemplo
```

Acesse http://localhost:8000 com o login `isadora.talamini@psystem.com` e a senha `psystem123`. O serviço `scheduler` roda `agenda:gerar` todo dia à 01:00.

### Backend: pronto, mas nunca executado

- `database/migrations/0001_01_01_000000_create_psystem_tables.php`: todas as tabelas numa migration só, espelhando o SQL.
- Models em `app/Models`. A tabela `agenda` é o model `Consulta`. Cada model tem um `paraTela()` que devolve o formato que o front já usava (datas `dd/mm/aaaa`, `name`, `phone`, `status` "Ativo" etc.). As conversões ficam em `app/Support/Tela.php`.
- Regras de negócio:
  - `app/Services/AgendaMatricula.php`: `gerar()` e `limparFuturas()`.
  - `Consulta::alterarStatus()`: cria, reativa ou cancela a cobrança da sessão.
  - `FinanceiroController`: baixa e estorno.
- Controllers e rotas em `routes/web.php`. O comando `agenda:gerar` fica em `routes/console.php`.
- Props compartilhadas em `app/Http/Middleware/HandleInertiaRequests.php`: `auth.user`, `patients` (todos, com resumo de sessões, matrícula e `cobrancaPendente`), `whatsapp`, `hours` e `flash.aviso`.
- Seeders: `DatabaseSeeder` (psicóloga, configurações e modelo de anamnese) e `ExemploSeeder`. Os arquivos em `database/seeders/dados/` foram gerados a partir dos dados de exemplo do front.
- **Falta:** testes em `tests/Feature` (o phpunit usa sqlite em memória; o índice parcial funciona lá) cobrindo:
  - a geração da agenda pela matrícula;
  - a cobrança criada ao marcar "realizado" e cancelada ao desmarcar;
  - o estorno.
- **Falta:** conferir a sintaxe do PHP, que nunca foi rodado.

### Front: em andamento

O front foi movido de `src/` para `resources/js/`. O padrão adotado:

- `useAppData()` continua existindo. `context/DataProvider.jsx` junta as props do Inertia (`usePage().props`) com as ações do objeto `actions`, que chamam `router.post/put/delete`. As ações recebem `opts` do Inertia; para fechar um modal só quando der certo, use `{ onSuccess: () => fechar() }`.
- Os erros de validação chegam em `useAppData().errors[campo]`. O `FormField` aceita `error`, e o `ErrorText` serve para inputs soltos.
- A navegação usa `navigate("pagina", query?)` de `utils/nav.js`, no lugar do antigo `onNavigate` do `App.jsx` (removido).
- O layout persistente fica em `components/layout/AppLayout.jsx`, definido em `app.jsx` pela opção `layout`. O `Auth/Login` fica sem layout.
- `TODAY` em `utils/date.js` agora é o dia de hoje de verdade.

**Já feito:** `app.jsx`, `AppLayout`, `DataProvider`, `utils/nav.js`, `Header` (nome e foto do usuário, botão Sair), `Sidebar`, `pages/Auth/Login.jsx`, `FormField` e `ErrorText`, `PrimaryButton` (aceita `type` e `disabled`), limpeza de `data/` (sem dados fixos), `pages/Pacientes/Pacientes.jsx` (abre o perfil em `/pacientes/{id}`) e `NewPatientModal`.

**Falta, tela por tela** (props que o controller já manda entre parênteses):

1. **`Pacientes/PatientProfile.jsx`** (`patientId`, `records`, `anamnese`, `documents`, `receivables`)
   - Pega o paciente em `patients.find(p => p.id === patientId)`.
   - "Voltar" vira `navigate("pacientes")`.
   - A foto usa `updatePatientPhoto(id, file)`.
   - Ativar/inativar usa `updatePatient(id, { ...patient, status })`.
   - Na edição, `updatePatient(id, form, { onSuccess })`.
   - `NewReceivableModal` manda `patientId`.
2. **Abas do perfil**
   - **`ProntuarioTab`:** usa `records` (lista do paciente) e `saveRecord(patientId, entry, { onSuccess })`. Tirar o campo "Sessão" de `RecordForm` e `blankRecordForm`, porque o número vem do servidor.
   - **`AnamneseTab` e `AnamneseForm`:** uma anamnese só. As seções vêm de `anamnese.secoes` (`key` = id da pergunta) e as respostas de `anamnese.respostas` (`{perguntaId: valor}`); a data sai de `anamnese.preenchidoEm`. Salvar com `saveAnamnese(patientId, respostas)`. Usar textarea quando o rótulo tem `textarea: true` em `data/anamnese.js`.
   - **`DocumentosTab`:** `addDocument(patientId, { title, file })` e `removeDocument(id)`. A `url` vem do servidor.
   - **`FinanceiroTab`:** `receivables` já vem filtrado pelo paciente; tirar o filtro por nome.
   - **`MatriculaTab`:** usa `hours` das props compartilhadas. Adicionar o campo "Valor da sessão" (`valor`). Salvar com `saveMatricula(patientId, { weekday, time, tipo, valor })` e remover com `removeMatricula(patientId)`.
3. **`components/financeiro/NewReceivableModal.jsx`**
   - Seleciona o paciente por `patientId`.
   - Sem o campo "Status".
   - Referência padrão "Sessão avulsa" e vencimento hoje.
4. **`components/whatsapp/WhatsappQuickModal.jsx`:** trocar `receivables.find(...)` por `patient.cobrancaPendente`.
5. **`Agenda/Agenda.jsx`** (`selectedDate`, `today`, `weekStart`, `events[]` com `isoDate`, `statusKey`, `recurring`, `patientId`)
   - Reescrever sem `dayOffset`. Mudar de dia com `router.get("/agenda", { data: "AAAA-MM-DD" }, { preserveState: true })`.
   - `AgendaWeekStrip` conta os eventos por `isoDate`.
   - Tirar os "Intervalos" (`isBreak`).
   - `NewAppointmentModal` manda `{ patientId, date, hora, tipo, status }` e mostra `errors.hora`.
   - `AppointmentDetailModal` ganha os botões Confirmar, Realizado, Falta e Cancelar, via `setAppointmentStatus(id, statusKey)`. "Ver prontuário" vira `navigate("prontuarios", { paciente: patientId })`.
6. **`Financeiro/Financeiro.jsx`** (`receivables`, `payables`)
   - Despesas com `addPayable`, `payPayable` e `reopenPayable`.
   - "Cobrar no WhatsApp" usa `r.patientId`.
   - `NewPayableModal` sem "Status".
   - O título "Mensalidades dos pacientes" vira "Sessões dos pacientes".
7. **`Prontuarios/Prontuarios.jsx`** (`selectedId`, `records`, `recordCounts`)
   - Trocar de paciente com `router.get("/prontuarios", { paciente: id }, { preserveState: true })`.
   - A contagem vem de `recordCounts[p.id]`.
8. **`Dashboard/Dashboard.jsx`** (`stats`, `goals`, `todayAppointments`, `weekOverview`, `weekLabel`, `revenueData`, `sessionsPerMonth`, `pendencias`)
   - Tirar os valores fixos. A saudação usa `auth.user.nome`.
   - `WeekOverviewCard` e `PendenciasFinanceirasCard` recebem os dados por prop.
   - `onNavigate` vira `navigate`.
9. **`Relatorios`** (`receivables`, `payables`, `sessions`, `anamneses`, `records`, `ocupacao`)
   - Trocar `initialSessions` por `sessions` e `initialPayables` por `payables`, ambos vindos de `useAppData()`.
   - `ReportOcupacao` usa as linhas `{ label, preenchidos, total }`.
   - Os períodos padrão fixos em 2026 viram datas calculadas.
10. **`Declaracoes`**
    - Sem o `onPrint` do App. Guardar o conteúdo de impressão no estado da própria página e renderizar `PrintArea` com `createPortal(..., document.body)`.
    - O nome e o CRP fixos ("Dra. Isadora Talamini") em `PrintArea` e em `data/declarations.js` passam a vir de `auth.user`.
11. **`Configuracoes`** (`goals`, `horario`, mais `auth.user` e `whatsapp` compartilhados)
    - Um estado único `{ perfil, senha: { atual, nova }, horario, goals, whatsapp }`. As abas passam a ser controladas por esse estado.
    - "Salvar alterações" chama `saveSettings(form)` e mostra `flash.aviso`.
    - A foto usa `updateProfilePhoto`.
    - Tirar o switch de duas etapas.
12. Procurar os usos que sobraram de chaves antigas do contexto: `grep -rn "goals\|updateGoals\|updateWhatsapp\|anamneses\|documents\|records\|initial" resources/js`.
13. Rodar `npm install && npm run build` e corrigir os erros de import e compilação.
