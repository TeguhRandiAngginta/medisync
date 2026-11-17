# syntax=docker/dockerfile:1

# ---------- Stage 1: build aset frontend (Vite + React) ----------
FROM node:20-alpine AS assets
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY vite.config.js tailwind.config.js postcss.config.js jsconfig.json ./
COPY resources ./resources
COPY public ./public
RUN npm run build

# ---------- Stage 2: dependency PHP (tanpa dev) ----------
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist \
    --ignore-platform-req=ext-gd --ignore-platform-req=ext-zip --ignore-platform-req=ext-intl

# ---------- Stage 3: PHP-FPM (target: app) ----------
FROM php:8.3-fpm-alpine AS app
WORKDIR /var/www/html

RUN apk add --no-cache libpng-dev libjpeg-turbo-dev freetype-dev libzip-dev icu-dev postgresql-dev oniguruma-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_pgsql gd zip intl bcmath exif opcache pcntl

COPY docker/php.ini /usr/local/etc/php/conf.d/zz-medisync.ini
COPY --from=vendor /app/vendor ./vendor
COPY . .
COPY --from=assets /build/public/build ./public/build
COPY --from=vendor /usr/bin/composer /usr/bin/composer

RUN composer dump-autoload --optimize --no-dev --no-scripts \
    && mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod +x docker/entrypoint.sh

ENTRYPOINT ["docker/entrypoint.sh"]
CMD ["php-fpm"]

# ---------- Stage 4: Nginx (target: web) ----------
FROM nginx:1.27-alpine AS web
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=app /var/www/html/public /var/www/html/public
RUN ln -sfn /var/www/html/storage/app/public /var/www/html/public/storage
