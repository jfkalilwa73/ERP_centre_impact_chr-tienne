# Utiliser l'image PHP CLI (et non FPM) pour le serveur de développement artisan
FROM php:8.4-cli-alpine

# Installer les dépendances système et extensions PHP requises pour Laravel + PostgreSQL
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    postgresql-dev \
    oniguruma-dev \
    freetype-dev \
    $PHPIZE_DEPS \
    && docker-php-ext-configure gd --with-freetype \
    && docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd zip intl opcache \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS

# Installer Composer globalement
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Définir le répertoire de travail
WORKDIR /var/www/html

# Exposer le port utilisé par php artisan serve
EXPOSE 8000

# Commande pour lancer le serveur de développement Laravel
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]