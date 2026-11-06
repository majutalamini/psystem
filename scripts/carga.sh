#!/bin/sh
# Teste de carga (etapa 3) com k6 em contêiner, contra o laboratório sintético na porta 8001.
# Pré-requisito: laboratório no ar (docker compose --profile diagnostico -f docker-compose.yml -f docker-compose.diagnostic.yml up -d diagnostic diagnostic-web).
set -eu
cd "$(dirname "$0")/.."
destino="artifacts/carga/$(date +%Y-%m-%dT%H-%M-%S)"
mkdir -p "$destino"
curl -fsS -o /dev/null http://127.0.0.1:8001/login || { echo "Laboratório indisponível na porta 8001." >&2; exit 1; }
# Padrão: o k6 roda dentro da rede do Docker e fala direto com o Nginx do laboratório, sem o repasse de
# portas do Docker Desktop (que no Windows/WSL distorce a latência com conexões simultâneas).
# REDE=host mede pelo caminho do navegador (127.0.0.1:8001).
if [ "${REDE:-interna}" = host ]; then rede=host; base=http://127.0.0.1:8001
else rede=$(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}' "$(docker compose --profile diagnostico -f docker-compose.yml -f docker-compose.diagnostic.yml ps -q diagnostic-web)"); base=http://diagnostic-web; fi
docker run --rm --network "$rede" -u "$(id -u):$(id -g)" -e BASE_URL="$base" \
  -v "$PWD/tests/carga:/scripts:ro" -v "$PWD/$destino:/out" \
  grafana/k6:0.54.0 run --summary-export /out/resumo.json /scripts/psystem.js | tee "$destino/saida.txt"
echo "rede=$rede base=$base" > "$destino/ambiente.txt"
echo "Resultados em $destino"
