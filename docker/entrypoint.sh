#!/bin/sh
set -e
cd /var/www/html

# Hanya service php-fpm yang menjalankan migrasi (RUN_MIGRATIONS=true)
if [ "$1" = "php-fpm" ]; then
  if [ -z "$APP_KEY" ]; then
    echo "ERROR: APP_KEY belum di-set. Jalankan: docker compose run --rm app php artisan key:generate --show" >&2
    exit 1
  fi
  php artisan storage:link --force >/dev/null 2>&1 || true
  if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    php artisan migrate --force
  fi
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
fi

exec "$@"
