#!/bin/sh
# Restaura um backup (etapa 4). Uso, dentro do serviço "backup":
#   sh /scripts/restaurar.sh /backups/diarios/psystem-AAAA-MM-DDTHH-MM-SS.tar.enc [banco_destino]
# Padrão: banco de teste "psystem_restauracao" e arquivos em /restauracao (teste de restauração, sem tocar a produção).
# Restaurar por cima do banco principal exige CONFIRMAR_PRODUCAO=sim e o sistema parado.
set -eu
: "${BACKUP_SENHA:?Defina BACKUP_SENHA}"
arquivo="${1:?Informe o arquivo .tar.enc}"
alvo="${2:-psystem_restauracao}"
if [ "$alvo" = "$DB_DATABASE" ] && [ "${CONFIRMAR_PRODUCAO:-}" != "sim" ]; then
  echo "Restaurar no banco principal exige CONFIRMAR_PRODUCAO=sim (e o sistema parado)." >&2; exit 1
fi
inicio=$(date +%s)
trab=$(mktemp -d)
trap 'rm -rf "$trab"' EXIT
export PGPASSWORD="$DB_PASSWORD"
psql_() { psql -h "${DB_HOST:-db}" -U "$DB_USERNAME" -v ON_ERROR_STOP=1 "$@"; }

openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_SENHA -in "$arquivo" | tar -C "$trab" -xf -
(cd "$trab" && sha256sum -c SHA256SUMS)

psql_ -d postgres -c "DROP DATABASE IF EXISTS \"$alvo\" WITH (FORCE)" -c "CREATE DATABASE \"$alvo\""
pg_restore -h "${DB_HOST:-db}" -U "$DB_USERNAME" -d "$alvo" --no-owner --exit-on-error "$trab/banco.dump"

if [ "$alvo" = "$DB_DATABASE" ]; then destino_arquivos=/storage/app; else destino_arquivos=/restauracao; fi
rm -rf "$destino_arquivos/private"
mkdir -p "$destino_arquivos"
tar -C "$destino_arquivos" -xzf "$trab/arquivos.tar.gz"

contagem="select (select count(*) from pacientes) pacientes, (select count(*) from agenda) consultas, (select count(*) from prontuarios) prontuarios, (select count(*) from documentos) documentos, (select count(*) from cobrancas) cobrancas, (select count(*) from pagamentos) pagamentos, (select count(*) from despesa_pagamentos) pagamentos_despesa"
echo "Restaurado em $alvo:"; psql_ -d "$alvo" -c "$contagem"
echo "Arquivos restaurados: $(find "$destino_arquivos/private" -type f | wc -l) em $destino_arquivos/private"
echo "Duração total: $(( $(date +%s) - inicio )) s"
