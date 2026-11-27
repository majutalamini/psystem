# Psystem

Sistema de agendamento e gestão para consultório de psicologia: pacientes, responsáveis, contratos (pacotes de sessões com dias e horários fixos), agenda, prontuários, anamnese, documentos, financeiro, relatórios, declarações, notificações no sistema e avisos por e-mail.

Um único projeto Laravel que entrega as telas em React pelo Inertia. Não existe API separada: o controller devolve os dados como props e a tela React os recebe.

## Stack

| Camada | Tecnologia |
|---|---|
| Back | Laravel 13, PHP 8.3+ (a imagem Docker usa 8.4) |
| Front | React 19, Inertia.js 3, Vite 8, lucide-react, recharts, SweetAlert2 |
| Banco | PostgreSQL 17 |
| Infra de dev | Docker Compose |
| Testes | PHPUnit 12, SQLite em memória |

## Como iniciar

Pré-requisitos: Docker com Docker Compose e Node.js instalado na máquina para o Vite. O Node não roda em container.

```bash
cp .env.example .env
docker compose build
docker compose run --rm app composer install
docker compose up -d --remove-orphans
npm ci
npm run build

docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate
docker compose exec app php artisan db:seed
```

Depois de subir:

| O quê | Endereço |
|---|---|
| Sistema | http://localhost:8000 |
| Vite (hot reload) | http://localhost:5173 |
| E-mails de teste (Mailpit) | http://localhost:8025 |
| Postgres no host | `localhost:5433` (usuário, senha e banco: `psystem`) |

A pasta `vendor/` fica num volume do Docker. O `app` instala as dependências se elas ainda não existirem, e o `scheduler` aguarda a instalação antes de iniciar.

O `db:seed` cria o login de desenvolvimento `isadora.talamini@psystem.com` / `psystem123`, as configurações padrão e o modelo de anamnese.

Para ter dados de exemplo (pacientes com contrato, quatro semanas de sessões, cobranças, um menor com responsável e um contrato bloqueado):

```bash
docker compose exec app php artisan db:seed --class=ExemploSeeder
```

### Serviços do `docker-compose.yml`

- `app`: `php artisan serve` com 4 workers.
- `scheduler`: `php artisan schedule:work`, que roda as tarefas agendadas.
- `db`: Postgres.
- `mailpit`: caixa de entrada de teste.

### Frontend local

Os containers executam PHP, PostgreSQL e Mailpit. As dependências e o build do frontend ficam na máquina:

```bash
npm ci
npm run build
```

Para desenvolver com atualização automática, rode `npm run dev` em outro terminal e mantenha-o aberto. Acesse o sistema pela porta 8000; a porta 5173 serve os arquivos do Vite. Para voltar ao build estático, pare o Vite, remova `public/hot` se existir e execute `npm run build`.

Ao atualizar uma instalação existente, execute `docker compose exec app php artisan migrate`. A migration de remoção da integração antiga apaga apenas seus registros de mensagens, consentimento e configurações; pacientes, agenda e financeiro são preservados. O rollback recria a estrutura, sem recuperar as mensagens apagadas. `docker compose up -d --remove-orphans` remove os containers que deixaram de ser usados, preservando os volumes.

## Comandos úteis

```bash
docker compose exec app php artisan test
docker compose exec app php artisan migrate
docker compose exec app php artisan contratos:processar
docker compose exec app php artisan agenda:gerar
docker compose exec app php artisan pacientes:sincronizar-status
npm run build
```

Tarefas agendadas (`routes/console.php`):

| Comando | Quando | O que faz |
|---|---|---|
| `contratos:processar` | todo dia 00:30 | Bloqueia o contrato de quem tem título vencido (e desbloqueia quem quitou), depois renova os pacotes que terminaram lançando a mensalidade do novo pacote |
| `agenda:gerar` | todo dia 01:00 | Completa a agenda dos próximos 2 meses a partir das matrículas ativas (só de pacientes ativos) |
| `despesas:gerar` | todo dia 01:20 | Lança a conta a pagar do mês de cada recorrência ativa, sem duplicar |
| `avisos:consultas` | a cada minuto | E-mail para a psicóloga cerca de 1 hora antes de cada consulta |
| `avisos:vencimentos` | todo dia 07:00 | E-mail das contas que vencem nos próximos 3 dias |

`pacientes:sincronizar-status` não é agendado: serve para acertar de uma vez o status dos pacientes já cadastrados.

## Como o sistema foi feito

### Origem

O front nasceu como um protótipo React com dados fixos e navegação por `useState`. Ele foi migrado para o Laravel: a navegação virou rotas, os dados fixos saíram, e o `DataProvider` agora lê as props do Inertia e expõe as ações (`router.post`, `router.put` etc.) pelo hook `useAppData()`. As decisões de modelagem estão em [docs/decisoes.md](docs/decisoes.md). Esse arquivo ainda descreve "uma matrícula por paciente", o que mudou (veja abaixo).

### Estrutura

```
app/
  Http/Controllers/   um por área (Paciente, Matricula, Agenda, Financeiro...)
  Http/Middleware/HandleInertiaRequests.php   dados compartilhados em toda tela
  Models/             Paciente, Matricula, Consulta (tabela agenda), Cobranca...
  Rules/Cpf.php       validação de CPF com dígitos verificadores
  Services/           AgendaMatricula, Avisos
  Support/Tela.php    formatação de datas, CPF e rótulos para o front
database/
  migrations/
  seeders/            DatabaseSeeder (mínimo) e ExemploSeeder
resources/js/
  pages/              uma pasta por tela (Pacientes, Agenda, Financeiro...)
  components/         peças compartilhadas (ui, layout, financeiro...)
  context/DataProvider.jsx   ações que viram requisições ao Laravel
  utils/              format.js, matricula.js, alertas.js...
routes/web.php        todas as rotas
routes/console.php    comandos e agendamentos
tests/Feature/
```

### Padrões do projeto

- **Dados para a tela:** cada model tem `paraTela()`, que devolve o formato que o React espera (por exemplo `patient.matriculas`). O `HandleInertiaRequests` compartilha a lista de pacientes, os horários e o `flash` em toda página.
- **Validação:** os controllers validam e devolvem os erros por campo. As telas mostram o erro abaixo do campo.
- **Banco:** nomes de tabela e colunas em português. Timestamps são `criado_em` e `atualizado_em`.
- **Login:** pela tabela `psicologos` (não existe `users`).

### Regras de negócio principais

**Contratos (pacote de sessões)** — `App\Services\Contratos`
- O contrato fica na aba **Contratos** do perfil do paciente: quantidade de sessões do pacote (ex.: 8), valor do pacote e data de início. A criação tem duas etapas e só termina com ao menos um dia e horário (a matrícula). Ao finalizar, o sistema cria as matrículas, gera a agenda e lança a mensalidade do primeiro pacote.
- Um ciclo (pacote) termina na data da N-ésima sessão, contada pelos dias e horários do contrato e pelos dias de atendimento (`contratos.ciclo_fim`). Cada ciclo gera uma cobrança (`cobrancas.contrato_id` + `ciclo`, únicos), vencendo no início do pacote.
- Sem encerramento, o contrato renova sozinho no dia seguinte ao fim do pacote (`contratos:processar`) e lança a próxima mensalidade.
- Paciente só tem um contrato em vigor (ativo ou bloqueado). Alterar o pacote recalcula o fim do ciclo atual e ajusta a mensalidade em aberto ainda sem pagamento.
- **Inadimplência:** título a receber vencido e não pago (venceu ontem ou antes) bloqueia o contrato. Bloqueado, as sessões futuras não confirmadas saem da agenda e o pacote não renova. Quitar os atrasados (ou cancelar/reagendar o título) desbloqueia na hora; se o pacote terminou durante o bloqueio, um novo pacote começa no dia do desbloqueio. O bloqueio é conferido na rotina diária e a cada recebimento, estorno, cancelamento ou mudança de vencimento.
- Encerrar (`DELETE /contratos/{id}`) encerra as matrículas, tira as sessões futuras da agenda e cancela as mensalidades que ainda vão vencer sem pagamento. O histórico continua.
- Rotas: `POST /pacientes/{id}/contratos`, `PUT /contratos/{id}`, `DELETE /contratos/{id}`.
- Na migração, as matrículas ativas que já existiam viraram um contrato por paciente (4 sessões por horário semanal, valor = soma das mensalidades), começando no dia da migração, sem nova cobrança.

**Matrículas (dias e horários do contrato)**
- Cada matrícula é um dia e horário fixos por semana, com modalidade, ligada ao contrato (`matriculas.contrato_id`). Ao criar ou alterar, o sistema gera as consultas dos próximos 2 meses (`AgendaMatricula`) e recalcula o fim do pacote.
- O contrato precisa ficar com ao menos uma matrícula: para parar os atendimentos, encerre o contrato.
- Não pode haver duas matrículas ativas no mesmo dia e horário, nem de pacientes diferentes nem do mesmo.
- Rotas: `POST /contratos/{id}/matriculas`, `PUT /matriculas/{id}`, `DELETE /matriculas/{id}`.

**Cobranças**
- Consulta avulsa tem o campo `valor` (obrigatório; 0 = sem cobrança). Com valor, cria uma única cobrança em aberto no paciente, ligada à consulta; cancelar a consulta cancela essa cobrança (falta não).
- Status da agenda: só **Falta** e **Cancelado**. Falta vale também direto de "Matriculado".

**Financeiro: ajustes**
- Título a receber em aberto: dá para alterar o vencimento (`PATCH /cobrancas/{id}`) e cancelar (`DELETE /cobrancas/{id}`; com recebimento registrado é preciso estornar antes). Título cancelado sai das telas e uma mensalidade cancelada não é recriada pelo comando.
- Conta a pagar: editar (`PUT /despesas/{id}`) e cancelar (`DELETE /despesas/{id}`, grava `cancelada_em`; some das telas e dos relatórios). Conta paga precisa do pagamento estornado antes.
- Conta a pagar recorrente: ao criar com "Repetir todo mês", a data informada define o dia; a primeira conta é criada na hora e `despesas:gerar` lança uma por mês, no começo do mês, vencendo no mesmo dia (31 vira o último dia dos meses curtos). Ao editar, "Aplicar também aos próximos meses" muda o modelo; `DELETE /despesas/{id}/recorrencia` encerra a recorrência.
- Documentos do paciente: `GET /documentos/{id}` só exibe (inline); `?baixar=1` faz o download. Tipos que o navegador não exibe (ex.: Word) só têm o botão de baixar.

**Status do paciente**
- Vem do contrato (`Paciente::sincronizarStatus()`): `ativo` com contrato ativo, `bloqueado` com contrato bloqueado por inadimplência e `inativo` sem contrato em vigor. Paciente novo nasce inativo.

**Responsáveis**
- Menu **Responsáveis** (abaixo de Pacientes): cadastro, lista e perfil com os pacientes de cada responsável. Um responsável pode ter vários pacientes.
- Paciente menor de 18 anos só é salvo com responsável (`pacientes.responsavel_id` + `responsavel_parentesco`). O responsável pode ser criado na hora, dentro do cadastro do paciente.
- O perfil do paciente mostra o responsável com atalho para o perfil dele. Responsável de paciente menor não pode ser excluído.

**Notificações** — `App\Services\Notificacoes`
- Sino no cabeçalho com o total; quando aparece notificação nova, uma caixinha abre sozinha embaixo do sino.
- Financeiro: contas a pagar vencidas ou que vencem em até 3 dias, mensalidades a vencer em até 3 dias e mensalidades em atraso. Agenda: sessões que ainda vão acontecer hoje.
- As notificações são calculadas na hora; só o que a psicóloga dispensa fica em `notificacoes_lidas`. Atrasos dispensados voltam no dia seguinte.

**Cadastro (P03)**
- CPF validado pela regra `App\Rules\Cpf`, data de nascimento não pode ser futura.
- `sexo` saiu do formulário, mas a coluna continua (o relatório de gênero usa).

**Financeiro**
- Quando uma consulta vira `realizado`, nasce uma cobrança `pendente` com o valor da matrícula **da própria consulta** (`agenda.matricula_id`) e vencimento na data da sessão. Consulta avulsa, sem matrícula, não gera cobrança.
- A cobrança pode ser recebida em partes. O estorno desfaz o último pagamento.
- Mais detalhes em [docs/decisoes.md](docs/decisoes.md).

### Alertas (SweetAlert2)

- `resources/js/utils/alertas.js` expõe `sucesso()` (toast), `erro()`, `errosDeCampo()` e `confirmar()`.
- `DataProvider.jsx` mostra um toast quando a ação dá certo e um resumo quando a validação falha. O servidor pode mandar `flash.sucesso` ou `flash.erro` para trocar a mensagem padrão.
- Erros HTTP (403, 404, 419, 429, 500) e queda de rede viram mensagens amigáveis em vez da página padrão do Laravel.
- Excluir paciente, encerrar matrícula e excluir anamnese pedem confirmação por `confirmar()`.

## Testes

```bash
docker compose exec app php artisan test
```

Rodam em SQLite em memória, com o relógio parado em 28/09/2026 às 10:00 (`ConsultorioTestCase`). Os testes cobrem agenda e matrícula, cobrança por sessão, financeiro, e-mails de aviso, recuperação de senha, cadastro de paciente e as telas com os dados de exemplo.

Os testes não passam pelo Postgres. Mudanças em migration devem ser conferidas também com `php artisan migrate` no Docker.

## Produção

Ainda não há configuração de produção no repositório. O `app` roda `php artisan serve`, que é servidor de desenvolvimento. Antes de publicar é preciso um Compose de produção (PHP-FPM com Nginx ou FrankenPHP), `npm run build` no ambiente de build, `.env` com `APP_ENV=production`, `APP_DEBUG=false` e senhas fortes, o banco e o Mailpit fora de portas públicas, HTTPS, volumes persistentes e backup do Postgres e de `storage/app`. Os dados são sensíveis (saúde), então o servidor deve ficar no Brasil.
