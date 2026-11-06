FROM node:24.16.0-bookworm-slim@sha256:2c87ef9bd3c6a3bd4b472b4bec2ce9d16354b0c574f736c476489d09f560a203 AS node-verificar

FROM php:8.4.27-fpm@sha256:3a6527017daca7917709afa08a37388ec108db093857f31d642cfff2e6f0449e AS php-base
RUN apt-get update && apt-get install -y --no-install-recommends git unzip libpq-dev libzip-dev libicu-dev gosu procps \
    && docker-php-ext-install pdo_pgsql zip intl opcache \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2@sha256:5190d9b445add2fa26090108273cb1ef1e1af98175201c737b85b3c4f90fbf7c /usr/bin/composer /usr/bin/composer
RUN { echo 'opcache.enable=1'; echo 'opcache.enable_cli=0'; echo 'opcache.memory_consumption=192'; \
    echo 'opcache.max_accelerated_files=20000'; echo 'opcache.validate_timestamps=0'; } > /usr/local/etc/php/conf.d/opcache.ini \
    && { echo 'upload_max_filesize=20M'; echo 'post_max_size=24M'; } > /usr/local/etc/php/conf.d/uploads.ini
WORKDIR /var/www

FROM php-base AS dependencies
COPY . .
# Sem public/storage: fotos e documentos ficam no disco privado e só saem por rota autenticada.
# As pastas vêm antes: o package:discover (Livewire/Pulse) precisa do cache de views.
RUN mkdir -p storage/framework/views storage/framework/cache/data storage/framework/sessions storage/app/private storage/app/public storage/logs \
    && composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader \
    && rm -f public/storage

FROM node-verificar AS assets
WORKDIR /var/www
COPY package.json package-lock.json ./
RUN npm ci --no-audit
COPY resources ./resources
COPY vite.config.js ./
COPY --from=dependencies /var/www/vendor ./vendor
ARG BUILD_MODE=production
RUN npm run build -- --mode "$BUILD_MODE"

FROM php-base AS app
ARG VCS_REF=local
LABEL org.opencontainers.image.revision=$VCS_REF
COPY --from=dependencies --chown=www-data:www-data /var/www /var/www
COPY --from=assets /var/www/public/build /var/www/public/build
COPY docker/php/pool.conf /usr/local/etc/php-fpm.d/zz-psystem.conf
ENTRYPOINT ["sh", "/var/www/docker/php/entrypoint.sh"]
CMD ["php-fpm", "-F"]

FROM nginx:stable-alpine@sha256:0e52bd054126cdc040b1276c0af347aeb02a41b9cfe305d6094767ac30e97949 AS web
ARG VCS_REF=local
LABEL org.opencontainers.image.revision=$VCS_REF
ENV FPM_UPSTREAM=app:9000 FPM_STATUS_UPSTREAM=app:9001 NGINX_ENVSUBST_FILTER=FPM_
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=dependencies /var/www/public /var/www/public
COPY --from=assets /var/www/public/build /var/www/public/build

FROM php-base AS verificar
COPY --from=node-verificar /usr/local/bin/node /usr/local/bin/node
COPY --from=node-verificar /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx
ENTRYPOINT ["sh", "/var/www/docker/verificar/entrypoint.sh"]
CMD ["composer", "verificar"]
