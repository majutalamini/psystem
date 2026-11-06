#!/bin/sh
set -eu
cd /var/www
mkdir -p storage/framework/views storage/framework/cache/data storage/framework/sessions storage/app/private storage/app/public storage/logs /tmp/composer /tmp/npm-cache
chown -R "${LOCAL_UID}:${LOCAL_GID}" storage
chown "${LOCAL_UID}:${LOCAL_GID}" vendor node_modules /tmp/composer /tmp/npm-cache
exec gosu "${LOCAL_UID}:${LOCAL_GID}" sh -c '
    if [ ! -f vendor/autoload.php ]; then composer install --no-interaction --prefer-dist; fi
    npm ci --no-audit
    exec "$@"
' sh "$@"
