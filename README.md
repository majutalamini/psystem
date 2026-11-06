# Psystem

Sistema de agendamento e gestão para consultório de psicologia: pacientes, matrículas (dia e horário fixos), agenda, prontuários, anamnese, documentos, financeiro, relatórios, declarações e avisos por e-mail.

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

Para ter dados de exemplo (pacientes com matrícula, quatro semanas de sessões e cobranças):

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
docker compose exec app php artisan agenda:gerar
docker compose exec app php artisan pacientes:sincronizar-status
npm run build
```

Tarefas agendadas (`routes/console.php`):

| Comando | Quando | O que faz |
|---|---|---|
| `agenda:gerar` | todo dia 01:00 | Completa a agenda dos próximos 2 meses a partir das matrículas ativas |
| `mensalidades:gerar` | todo dia 01:10 | Lança a mensalidade do mês (título em aberto no financeiro) das matrículas ativas com valor, sem duplicar |
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

**Matrículas (P13)**
- Um paciente pode ter várias matrículas. Cada uma é um dia e horário fixos por semana, com modalidade e `valor_sessao`.
- Ao criar ou alterar, o sistema gera as consultas dos próximos 2 meses (a agenda não abre além disso) na tabela `agenda` (`AgendaMatricula`). Ao alterar, as consultas futuras ainda "agendadas" são apagadas e geradas de novo.
- Encerrar (`DELETE /matriculas/{id}`) não apaga a linha: marca `status_matricula = encerrada` e `fim_da_matricula`, e tira as consultas futuras não confirmadas. O histórico e as cobranças continuam.
- Não pode haver duas matrículas ativas no mesmo dia e horário, nem de pacientes diferentes nem do mesmo.
- Rotas: `POST /pacientes/{id}/matriculas`, `PUT /matriculas/{id}`, `DELETE /matriculas/{id}`.

**Mensalidade e cobranças**
- O valor da matrícula (`valor_sessao`) é a mensalidade. Com valor maior que zero, ao lançar a matrícula o sistema cria um título em aberto no financeiro do paciente (`Mensalidades`), vencendo no dia configurado no perfil (`pacientes.dia_vencimento`, padrão 10; dia 31 vira o último dia dos meses curtos). Se o vencimento do mês já passou, o primeiro título é o do mês seguinte.
- Depois disso, `mensalidades:gerar` lança um título por matrícula e mês (sem duplicar, índice único `matricula_id` + `competencia`).
- Alterar o valor atualiza só os títulos em aberto sem pagamento; mudar o dia de vencimento (`PATCH /pacientes/{id}/vencimento`) reagenda os títulos em aberto; encerrar a matrícula cancela os que ainda vão vencer e não receberam nada.
- Consulta avulsa tem o campo `valor` (obrigatório; 0 = sem cobrança). Com valor, cria uma única cobrança em aberto no paciente, ligada à consulta; cancelar a consulta cancela essa cobrança (falta não).
- Status da agenda: só **Falta** e **Cancelado**. Falta vale também direto de "Matriculado".

**Financeiro: ajustes**
- Título a receber em aberto: dá para alterar o vencimento (`PATCH /cobrancas/{id}`) e cancelar (`DELETE /cobrancas/{id}`; com recebimento registrado é preciso estornar antes). Título cancelado sai das telas e uma mensalidade cancelada não é recriada pelo comando.
- Conta a pagar: editar (`PUT /despesas/{id}`) e cancelar (`DELETE /despesas/{id}`, grava `cancelada_em`; some das telas e dos relatórios). Conta paga precisa do pagamento estornado antes.
- Conta a pagar recorrente: ao criar com "Repetir todo mês", a data informada define o dia; a primeira conta é criada na hora e `despesas:gerar` lança uma por mês, no começo do mês, vencendo no mesmo dia (31 vira o último dia dos meses curtos). Ao editar, "Aplicar também aos próximos meses" muda o modelo; `DELETE /despesas/{id}/recorrencia` encerra a recorrência.
- Documentos do paciente: `GET /documentos/{id}` só exibe (inline); `?baixar=1` faz o download. Tipos que o navegador não exibe (ex.: Word) só têm o botão de baixar.

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

Rodam em SQLite em memória, com o relógio parado em 28/09/2026 às 10:00 (`ConsultorioTestCase`). Os testes cobrem agenda e matrícula, cobrança por sessão, financeiro, e-mails de aviso, recuperação de senha, cadastro de paciente e as telas com os dados de exemplo.

Os testes não passam pelo Postgres. Mudanças em migration devem ser conferidas também com `php artisan migrate` no Docker.

## Produção

Ainda não há configuração de produção no repositório. O `app` roda `php artisan serve`, que é servidor de desenvolvimento. Antes de publicar é preciso um Compose de produção (PHP-FPM com Nginx ou FrankenPHP), `npm run build` no ambiente de build, `.env` com `APP_ENV=production`, `APP_DEBUG=false` e senhas fortes, o banco e o Mailpit fora de portas públicas, HTTPS, volumes persistentes e backup do Postgres e de `storage/app`. Os dados são sensíveis (saúde), então o servidor deve ficar no Brasil.
