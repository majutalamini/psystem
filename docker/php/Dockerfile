FROM php:8.4-cli

RUN apt-get clean && rm -rf /var/lib/apt/lists/* \
    && apt-get update --fix-missing \
    && apt-get install -y --no-install-recommends git unzip libpq-dev libzip-dev libicu-dev \
    && docker-php-ext-install pdo_pgsql zip intl opcache \
    && rm -rf /var/lib/apt/lists/*

# Opcache guarda o PHP compilado em memória: sem ele cada requisição relê todo o vendor/.
RUN { \
        echo 'opcache.enable=1'; \
        echo 'opcache.enable_cli=1'; \
        echo 'opcache.memory_consumption=192'; \
        echo 'opcache.max_accelerated_files=20000'; \
        echo 'opcache.validate_timestamps=1'; \
        echo 'opcache.revalidate_freq=2'; \
    } > /usr/local/etc/php/conf.d/opcache.ini

# O padrão do PHP (2 MB) recusa fotos tiradas com o celular; o sistema aceita imagens de até 4 MB.
RUN {         echo 'upload_max_filesize=20M';         echo 'post_max_size=24M';     } > /usr/local/etc/php/conf.d/uploads.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
