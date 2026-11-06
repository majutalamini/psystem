# Psystem

Sistema para gestão de um consultório de psicologia, com agenda, pacientes, matrículas, prontuários, anamneses, documentos e financeiro. A interface e as validações estão em português brasileiro.

## Funcionalidades

- Cadastro de pacientes com CPF validado, UF, contatos, foto e histórico.
- Várias matrículas por paciente, cada uma com dia, horário, modalidade e valor mensal.
- Agenda diária, semanal e mensal, com uma janela móvel de **dois meses**.
- Consultas simultâneas com limite opcional; o mesmo paciente não pode ocupar duas vezes o mesmo horário.
- Mensalidades por matrícula e competência, com dia de vencimento definido no perfil do paciente.
- Consultas avulsas com valor próprio e cobrança independente da mensalidade.
- Contas a receber, pagamentos parciais, alteração de vencimento e estornos individuais com motivo.
- Contas a pagar avulsas ou recorrentes, edição, cancelamento e encerramento da recorrência.
- Prontuários e anamneses com controle de versão para evitar sobrescrita entre abas.
- Importação de arquivos Word (.docx), conferência antes de gravar e histórico das importações.
- Documentos privados, visualização dos formatos compatíveis, download e confirmação de remoção.
- Declarações, relatórios, monitoramento e rotinas de backup.

## Tecnologias

| Área | Tecnologias |
|---|---|
| Backend | PHP 8.4 na imagem Docker, Laravel 13 e Eloquent |
| Interface | React 19, Inertia.js 3 e Vite 8 |
| Componentes | Lucide, Recharts, SweetAlert2 e react-currency-input-field |
| Banco | PostgreSQL 17 |
| Servidor | Nginx e PHP-FPM |
| HTTPS | Caddy no Compose de servidor |
| Processamento | Laravel Queue e Scheduler |
| Monitoramento | Laravel Pulse, prontidão e logs com identificador de requisição |
| Testes | PHPUnit, Playwright e k6 |
| Ambiente | Docker Compose; desenvolvimento no filesystem Linux do WSL2 |

## Instalação local

### Requisitos

- Git e Docker com Docker Compose.
- No Windows, WSL2 com a integração do Docker Desktop habilitada.
- Node.js 24 para HMR, preparação dos bancos de teste e roteiros de navegador. O build de produção instala as dependências dentro do Docker.

Mantenha o projeto no filesystem Linux do WSL. Nesta instalação, a cópia mantida está em `/home/aam/projetos/psystem`, na distribuição `Psystem`. Execute os comandos abaixo na raiz dessa cópia.

```bash
cp .env.example .env
```

Edite o `.env` antes de iniciar:

- Defina uma senha em `DB_PASSWORD`.
- Preencha `LOCAL_UID` e `LOCAL_GID` com os valores de `id -u` e `id -g`.
- Defina `BACKUP_SENHA` para os backups criptografados e guarde essa chave fora do servidor.
- Use um nome fixo em `COMPOSE_PROJECT_NAME` para manter o mesmo conjunto de containers e volumes. Nesta instalação, ele é `psystem-etapa-1`.

```bash
# Constrói as imagens da aplicação e da ferramenta de verificação.
docker compose --profile tools build

# Gera APP_KEY no .env local.
docker compose --profile tools run --rm --no-deps -T verificar php artisan key:generate

# Prepara o banco antes de iniciar os processos em segundo plano.
docker compose up -d --wait db
docker compose run --rm --no-deps app php artisan migrate --force
docker compose run --rm --no-deps app php artisan db:seed --force

# Inicia os serviços normais do sistema.
docker compose up -d
```

Acesse **http://localhost:8000**. A seed inicial cria a conta de desenvolvimento da psicóloga, as configurações e o modelo de anamnese; confira `database/seeders/DatabaseSeeder.php`. Altere as credenciais antes de disponibilizar uma instalação publicamente. Pacientes e massas de exemplo não fazem parte da instalação.

O PostgreSQL não publica sua porta no Compose principal. O override `docker-compose.dev.yml` disponibiliza a porta 5433 somente em `127.0.0.1`.

## Containers e perfis

Um `docker compose up -d` inicia os sete serviços principais:

| Serviço | Responsabilidade |
|---|---|
| `app` | Executa o Laravel pelo PHP-FPM |
| `web` | Nginx e acesso HTTP na porta 8000 |
| `db` | PostgreSQL |
| `scheduler` | Completa a agenda, gera mensalidades e contas recorrentes e dispara avisos |
| `fila` | Processa os e-mails enfileirados |
| `backup` | Agenda o backup criptografado diário |
| `pulse` | Coleta as métricas de monitoramento |

Os ambientes auxiliares são opcionais:

| Perfil | Serviços | Uso |
|---|---|---|
| `tools` | `verificar` | Verificação local e testes PHP |
| `mailpit` | `mailpit` | Caixa de e-mails de desenvolvimento, porta 8025 |
| `diagnostico` | `diagnostic`, `diagnostic-web` | Laboratório isolado, porta 8001 |
| `e2e` | `e2e`, `e2e-web` | Testes de navegador, porta 8002 |

Os perfis de diagnóstico e E2E dependem dos respectivos arquivos Compose. Mesmo incluindo esses arquivos, eles não entram na inicialização padrão.

```bash
# E-mail local de teste, somente quando necessário.
docker compose --profile mailpit up -d mailpit

# Laboratório de diagnóstico; a preparação da massa sintética é local.
docker compose -f docker-compose.yml -f docker-compose.diagnostic.yml --profile diagnostico up -d diagnostic diagnostic-web

# Ambiente isolado dos testes de navegador.
docker compose -f docker-compose.yml -f docker-compose.e2e.yml --profile e2e up -d e2e e2e-web
```

Por padrão local, `MAIL_MAILER=log`: os e-mails são registrados nos logs. Para o Mailpit, configure `MAIL_MAILER=smtp`, `MAIL_HOST=mailpit` e `MAIL_PORT=1025`, depois recrie os serviços que enviam e-mails. Para envio real, configure o SMTP do provedor.

## Regras importantes

### Agenda e matrículas

A matrícula gera consultas até a data atual mais dois meses. O Scheduler completa essa janela periodicamente; abrir a agenda só consulta os dados. A navegação respeita o limite disponível e a grade mensal é carregada em uma resposta.

A matrícula permanece no histórico ao ser encerrada. Quando a última matrícula ativa é encerrada, o paciente é inativado e as consultas futuras saem da agenda. Registros passados são preservados. Se houver mensalidades a vencer sem recebimento, a tela pergunta se também devem ser canceladas.

### Financeiro

A mensalidade é única por matrícula e mês. Ao criar a matrícula, se o vencimento daquele mês já passou, o primeiro título é do mês seguinte. O dia é ajustado ao último dia dos meses mais curtos. Alterações de valor e vencimento respeitam os títulos já recebidos.

A consulta avulsa recebe seu próprio valor e título. Cancelar uma consulta pode cancelar seu título ainda em aberto e sem recebimentos; registrar falta mantém a cobrança.

Pagamentos podem ser parciais. O estorno é feito por pagamento, exige motivo e preserva o histórico. Reenvios identificados não duplicam pagamentos. Cancelar uma conta recorrente preserva seu registro; encerrar a recorrência impede os próximos lançamentos.

### Dados clínicos e arquivos

Cadastros com histórico clínico ou financeiro são preservados; use a inativação para retirar o paciente da rotina. Prontuários e anamneses recusam alterações sobre versões antigas. Fotos e documentos são privados e exigem autenticação. Contas podem ter seu acesso revogado imediatamente.

## Atualização do sistema

O código e os assets são copiados para as imagens. Para aplicar mudanças em uma instalação existente:

```bash
docker compose build
docker compose run --rm --no-deps app php artisan migrate --force
docker compose up -d
```

Ao atualizar uma instalação antiga que usava fotos públicas, execute uma vez:

```bash
docker compose exec -u www-data app php artisan fotos:tornar-privadas
```

Banco, documentos, fotos e backups ficam em volumes. Preserve esses volumes durante atualizações; `docker compose down -v` remove os dados.

## Desenvolvimento e testes

Para desenvolvimento com código montado e HMR:

```bash
npm ci
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d app web scheduler
npm run dev
```

A interface continua na porta 8000 e o Vite utiliza a 5173. Pare o Vite e remova um eventual `public/hot` residual antes de voltar às imagens de produção.

Prepare o banco isolado e execute a verificação:

```bash
npm run test:prepare
sh scripts/verificar-local.sh
```

Para executar diretamente pelo serviço de ferramentas:

```bash
docker compose --profile tools run --rm -T verificar composer verificar
```

O wrapper `scripts/verificar-local.sh` é usado pelo hook de pre-commit e verifica formatação PHP, testes, schema, build e auditorias de dependências npm/Composer. A suíte PHP usa exclusivamente PostgreSQL no banco `psystem_test`; os testes recusam o banco principal.

Para os testes de navegador, após preparar os bancos:

```bash
sh scripts/e2e.sh
```

Os testes E2E usam `psystem_e2e`. Os roteiros de carga usam k6 e um laboratório sintético isolado; `scripts/carga.sh` depende dessa preparação local.

## Operação e backup

- `/pulse`: painel de monitoramento autenticado.
- `/prontidao`: resposta resumida para monitoramento externo.
- `php artisan operacao:status`: diagnóstico operacional detalhado.
- `php artisan agenda:gerar`: completa a agenda.
- `php artisan mensalidades:gerar`: gera as mensalidades.
- `php artisan despesas:gerar`: gera as contas recorrentes.
- `php artisan psicologo:revogar EMAIL`: revoga o acesso de uma conta.
- `php artisan psicologo:reativar EMAIL`: reativa uma conta.

Execute os comandos Artisan pelo serviço `app`, por exemplo:

```bash
docker compose exec -u www-data app php artisan operacao:status
```

O serviço `backup` usa `pg_dump`, inclui os arquivos privados e criptografa o pacote com `BACKUP_SENHA`. A retenção é de 30 diários e 12 mensais; o horário padrão é 02:30. Para cópia externa, configure `BACKUP_EXTERNO_DIR` e crie um arquivo `.destino-externo` no destino real.

A restauração usa o script `docker/backup/restaurar.sh` e, por padrão, restaura em `psystem_restauracao`, sem substituir o banco principal. Guarde e teste a chave do backup fora do servidor.

## HTTPS no servidor

O arquivo `docker-compose.servidor.yml` acrescenta o Caddy. Configure `DOMINIO`, `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://SEU_DOMINIO`, `SESSION_SECURE_COOKIE=true` e os proxies confiáveis conforme o ambiente.

```bash
docker compose -f docker-compose.yml -f docker-compose.servidor.yml up -d --build
```

O domínio precisa apontar para o servidor e as portas 80 e 443 devem estar disponíveis.

## Organização do código

```text
app/Actions/          Casos de uso, estados iniciais e operações com concorrência
app/Http/             Controllers e middlewares
app/Models/           Modelos e relacionamentos
app/Queries/          Consultas e projeções de leitura
app/Services/         Agenda, mensalidades, recorrências e avisos
app/Support/          Formatação, métricas, prontidão e verificação do schema
database/migrations/  Evolução do banco
database/seeders/     Instalação mínima
resources/js/         Interface React
routes/               Rotas HTTP e comandos agendados
docker/               PHP, Nginx, Caddy e rotinas de backup
scripts/              Verificações e testes mantidos no projeto
tests/                Testes PHP, navegador e carga
```

O manifesto versionado em `database/schema-permitido.json` classifica o schema e os hashes das migrations. Estados de negócio são definidos no PHP; alterações de persistência precisam atualizar essa classificação.

O `README.md` é versionado. Os demais documentos locais, relatórios, massas sintéticas, scripts temporários, backups gerados, segredos e artefatos de build permanecem no `.gitignore`.
