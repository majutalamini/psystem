#!/bin/sh
set -eu
cd "$(git rev-parse --show-toplevel)"
common=$(git rev-parse --path-format=absolute --git-common-dir)
gitdir=$(git rev-parse --absolute-git-dir)
case "$gitdir" in
    "$common") container_git=/git-common ;;
    "$common"/*) container_git="/git-common${gitdir#"$common"}" ;;
    *) echo 'Diretório Git fora do common-dir; verificação interrompida.' >&2; exit 1 ;;
esac
# Uma worktree tem .git como arquivo apontando ao host. Monte os metadados
# explicitamente para identificar commit/diff dentro do container, sem reescrevê-los.
# Evita conversão MSYS dos caminhos de destino/env do container no Git Bash.
export MSYS_NO_PATHCONV=1
exec docker compose --profile tools run --rm -T \
    --volume "$common:/git-common:ro" \
    --env "PSYSTEM_GIT_DIR=$container_git" --env PSYSTEM_GIT_COMMON_DIR=/git-common \
    verificar composer verificar
