#!/bin/sh
# Executa o backup uma vez por dia no horário BACKUP_HORA (padrão 02:30, fuso do contêiner).
set -u
hora="${BACKUP_HORA:-02:30}"
while true; do
  agora=$(date +%s)
  alvo=$(date -d "today $hora" +%s)
  [ "$alvo" -le "$agora" ] && alvo=$(date -d "tomorrow $hora" +%s)
  echo "Próximo backup: $(date -d "@$alvo" -Iseconds)"
  sleep $(( alvo - agora ))
  sh /scripts/backup.sh || echo "FALHA no backup de $(date -Iseconds)" >&2
done
