#!/bin/sh
# Testes de navegador (etapa 3): sobe o ambiente isolado na porta 8002, recria o banco psystem_e2e
# com dados mínimos de teste e roda o Playwright. Nada toca o banco principal.
set -eu
cd "$(dirname "$0")/.."
compose="docker compose --profile e2e -f docker-compose.yml -f docker-compose.e2e.yml"

usuario=$(sed -n 's/^DB_USERNAME=//p' .env | tr -d '\r"')
existe=$($compose exec -T db psql -U "$usuario" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'psystem_e2e'")
[ "$existe" = "1" ] || $compose exec -T db psql -U "$usuario" -d postgres -c "CREATE DATABASE psystem_e2e"

$compose up -d --build e2e e2e-web
banco=$($compose exec -T e2e printenv DB_DATABASE | tr -d '\r')
[ "$banco" = "psystem_e2e" ] || { echo "Banco inesperado ($banco); abortado." >&2; exit 1; }
$compose exec -T -u www-data e2e php artisan migrate:fresh --force --seed
$compose exec -T -u www-data e2e php tests/Support/preparar-e2e.php
$compose exec -T -u www-data e2e php artisan agenda:gerar

mkdir -p artifacts/e2e
npx playwright test --config=playwright.config.mjs "$@"
