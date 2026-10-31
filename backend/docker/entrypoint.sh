#!/bin/sh
set -e
cd /var/www/html

composer install --no-interaction --prefer-dist

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chmod -R ug+rwx storage bootstrap/cache || true

exec /usr/bin/supervisord -c /etc/supervisord.conf
