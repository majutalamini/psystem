#!/bin/sh
# Backup do Psystem (etapa 4): banco (pg_dump) + arquivos privados (documentos e fotos), conferidos por
# SHA-256 e criptografados (AES-256, chave em BACKUP_SENHA). Retenção: 30 diários e 12 mensais.
# Cópia externa: se /externo tiver o arquivo .destino-externo (criado de propósito no destino real).
# Roda dentro do serviço "backup" do docker compose.
set -eu
: "${BACKUP_SENHA:?Defina BACKUP_SENHA no .env (guarde essa senha fora do servidor: sem ela o backup não abre).}"
umask 077
agora=$(date +%Y-%m-%dT%H-%M-%S)
mes=$(date +%Y-%m)
inicio=$(date +%s)
mkdir -p /backups/diarios /backups/mensais
trab=$(mktemp -d)
trap 'rm -rf "$trab"' EXIT

PGPASSWORD="$DB_PASSWORD" pg_dump -h "${DB_HOST:-db}" -U "$DB_USERNAME" -d "$DB_DATABASE" -Fc -f "$trab/banco.dump"
tar -C /storage/app -czf "$trab/arquivos.tar.gz" --exclude='private/backup' private
(cd "$trab" && sha256sum banco.dump arquivos.tar.gz > SHA256SUMS)

destino="/backups/diarios/psystem-$agora.tar.enc"
tar -C "$trab" -cf - banco.dump arquivos.tar.gz SHA256SUMS \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:BACKUP_SENHA -out "$destino"
# Confere se o arquivo cifrado abre e se o conteúdo bate antes de considerar o backup válido.
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_SENHA -in "$destino" | tar -tf - > "$trab/lista"
grep -q '^SHA256SUMS$' "$trab/lista" || { echo "Backup gerado não abre; abortado." >&2; rm -f "$destino"; exit 1; }

# Um mensal por mês (o primeiro backup do mês).
ls /backups/mensais/psystem-"$mes"-*.tar.enc >/dev/null 2>&1 || cp "$destino" "/backups/mensais/psystem-$agora.tar.enc"
# Retenção.
ls -1t /backups/diarios/psystem-*.tar.enc | tail -n +31 | xargs -r rm -f
ls -1t /backups/mensais/psystem-*.tar.enc | tail -n +13 | xargs -r rm -f

externo=false
if [ -f /externo/.destino-externo ] && [ -w /externo ]; then
  mkdir -p /externo/diarios /externo/mensais
  cp "$destino" /externo/diarios/
  ls -1t /externo/diarios/psystem-*.tar.enc | tail -n +31 | xargs -r rm -f
  ultimo_mensal=$(ls -1t /backups/mensais/psystem-*.tar.enc | head -n 1)
  [ -f "/externo/mensais/$(basename "$ultimo_mensal")" ] || cp "$ultimo_mensal" /externo/mensais/
  ls -1t /externo/mensais/psystem-*.tar.enc | tail -n +13 | xargs -r rm -f
  externo=true
fi

tamanho=$(stat -c %s "$destino")
soma=$(sha256sum "$destino" | cut -d' ' -f1)
# Registro legível pela aplicação (prontidão); o backup em si continua só para o root.
mkdir -p /storage/app/private/backup
chmod 755 /storage/app/private/backup
cat > /storage/app/private/backup/ultimo-backup.json <<JSON
{"concluido_em": "$(date -Iseconds)", "arquivo": "$(basename "$destino")", "bytes": $tamanho, "sha256": "$soma", "duracao_s": $(( $(date +%s) - inicio )), "externo": $externo}
JSON
chmod 644 /storage/app/private/backup/ultimo-backup.json
echo "Backup concluído: $destino ($tamanho bytes, externo=$externo, $(( $(date +%s) - inicio )) s)"
