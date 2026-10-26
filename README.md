# Psystem

Sistema de agendamento e gestão para consultório de psicologia: pacientes, matrículas (dia e horário fixos), agenda, prontuários, anamnese, documentos, financeiro, relatórios, declarações e lembretes por WhatsApp e e-mail.

Um único projeto Laravel que entrega as telas em React pelo Inertia. Não existe API separada: o controller devolve os dados como props e a tela React os recebe.

## Stack

| Camada | Tecnologia |
|---|---|
| Back | Laravel 13, PHP 8.3+ (a imagem Docker usa 8.4) |
| Front | React 19, Inertia.js 3, Vite 8, lucide-react, recharts, SweetAlert2 |
| Banco | PostgreSQL 17 |
| Infra de dev | Docker Compose |
| WhatsApp | Evolution API ou Twilio (ou modo "teste", que só registra) |
| Testes | PHPUnit 12, SQLite em memória |

## Como iniciar

Pré-requisito: Docker com Docker Compose.

```bash
cp .env.example .env
docker compose build
docker compose run --rm app composer install
docker compose up -d

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
| Evolution API (WhatsApp) | http://localhost:8080/manager |
| Postgres no host | `localhost:5433` (usuário, senha e banco: `psystem`) |

O `composer install` roda antes do `up` porque a pasta `vendor/` fica num volume do Docker, que começa vazio. Sem ele o `app` e o `scheduler` caem ao subir.

O `db:seed` cria o login de desenvolvimento `isadora.talamini@psystem.com` / `psystem123`, as configurações padrão e o modelo de anamnese.

Para ter dados de exemplo (pacientes com matrícula, quatro semanas de sessões e cobranças):

```bash
docker compose exec app php artisan db:seed --class=ExemploSeeder
```

### Serviços do `docker-compose.yml`

- `app`: `php artisan serve` com 4 workers.
- `scheduler`: `php artisan schedule:work`, que roda as tarefas agendadas.
- `node`: `npm install && npm run dev`.
- `db`: Postgres.
- `mailpit`: caixa de entrada de teste.
- `evolution` e `redis`: só são usados se `WHATSAPP_MODO=evolution`.

### WhatsApp

`WHATSAPP_MODO` no `.env`:

- `teste`: só registra as mensagens (Configurações › WhatsApp). É o padrão.
- `evolution`: envia pela Evolution API. Defina `EVOLUTION_API_KEY` e conecte o número por QR code no painel.
- `twilio`: envia pela Twilio. Preencha as variáveis `TWILIO_*`.

## Comandos úteis

```bash
docker compose exec app php artisan test
docker compose exec app php artisan migrate
docker compose exec app php artisan agenda:gerar
docker compose exec app php artisan pacientes:sincronizar-status
docker compose exec node npm run build
```

Tarefas agendadas (`routes/console.php`):

| Comando | Quando | O que faz |
|---|---|---|
| `agenda:gerar` | todo dia 01:00 | Completa a agenda das próximas 4 semanas a partir das matrículas ativas |
| `avisos:consultas` | a cada minuto | E-mail para a psicóloga cerca de 1 hora antes de cada consulta |
| `avisos:vencimentos` | todo dia 07:00 | E-mail das contas que vencem nos próximos 3 dias |
| `whatsapp:lembretes` | todo dia 09:00 | Lembrete de sessão do dia seguinte |
| `whatsapp:cobrancas` | todo dia 09:00 | Cobranças que vencem em "dias antes" (Configurações) |

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
  Services/           AgendaMatricula, Avisos, AvisosWhatsapp, WhatsApp/
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

**Matrículas (P13)**
- Um paciente pode ter várias matrículas. Cada uma é um dia e horário fixos por semana, com modalidade e `valor_sessao`.
- Ao criar ou alterar, o sistema gera as consultas das próximas 4 semanas na tabela `agenda` (`AgendaMatricula`). Ao alterar, as consultas futuras ainda "agendadas" são apagadas e geradas de novo.
- Encerrar (`DELETE /matriculas/{id}`) não apaga a linha: marca `status_matricula = encerrada` e `fim_da_matricula`, e tira as consultas futuras não confirmadas. O histórico e as cobranças continuam.
- Não pode haver duas matrículas ativas no mesmo dia e horário, nem de pacientes diferentes nem do mesmo.
- Rotas: `POST /pacientes/{id}/matriculas`, `PUT /matriculas/{id}`, `DELETE /matriculas/{id}`.

**Status do paciente (P14)**
- O paciente é `ativo` se tiver ao menos uma matrícula ativa, e `inativo` se não tiver. Isso é calculado em `Paciente::sincronizarStatus()`, chamado ao criar e ao encerrar matrícula.
- Não há mais troca manual de status no cadastro. Paciente novo nasce inativo até ter matrícula.

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

Rodam em SQLite em memória, com o relógio parado em 28/09/2026 às 10:00 (`ConsultorioTestCase`). Os testes cobrem agenda e matrícula, cobrança por sessão, financeiro, WhatsApp, e-mails de aviso, recuperação de senha, cadastro de paciente e as telas com os dados de exemplo.

Os testes não passam pelo Postgres. Mudanças em migration devem ser conferidas também com `php artisan migrate` no Docker.

## Produção

Ainda não há configuração de produção no repositório. O `app` roda `php artisan serve`, que é servidor de desenvolvimento. Antes de publicar é preciso um Compose de produção (PHP-FPM com Nginx ou FrankenPHP), `npm run build` em vez do container `node`, `.env` com `APP_ENV=production`, `APP_DEBUG=false` e senhas fortes, o banco e o Mailpit fora de portas públicas, HTTPS, volumes persistentes e backup do Postgres e de `storage/app`. Os dados são sensíveis (saúde), então o servidor deve ficar no Brasil.
