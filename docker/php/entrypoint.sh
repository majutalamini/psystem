#!/bin/sh
set -eu
cd /var/www
for path in storage storage/framework storage/framework/views storage/framework/cache storage/framework/cache/data storage/framework/sessions storage/app storage/app/private storage/app/public storage/logs; do
    mkdir -p "$path"
    chown www-data:www-data "$path"
done
exec docker-php-entrypoint "$@"
