# ERP Église - Centre Impact Chrétien

Plateforme d'administration de l'Église. L'API Laravel, le frontend Vite, PostgreSQL, Redis, MinIO et Mailpit tournent dans un Compose réservé à ce dépôt.

## Équipe

- **Elie** : frontend React
- **Jean François** : API Laravel
- **Bienvenu** : PostgreSQL et modèle métier

## Isolation Docker

| Élément | Valeur |
| --- | --- |
| Projet Compose | `erp_centre_impact_chr-tienne` |
| Réseau | `erp_centre_impact_chr-tienne_net_laravel` |
| Conteneurs | préfixe `erp_centre_impact_chr-tienne-` |
| Volumes | préfixe `erp_centre_impact_chr-tienne_` |

Le schéma (triggers, UUID, `plpgsql`) est PostgreSQL. Il n'y a pas de service MySQL : le port hôte **3306** n'est pas ouvert par ce projet. Le port **5432** de l'hôte est déjà occupé par un autre PostgreSQL, donc la base de ce projet n'est pas publiée sur l'hôte. Le backend la joint par le nom de service `postgres` sur le port interne **5432**. Le port **8081** est déjà pris par un autre processus Node : le frontend Vite est publié sur **3000**.

## Ports

| Service | Hôte | Conteneur | URL |
| --- | --- | --- | --- |
| API Laravel | 8000 | 80 | http://localhost:8000 |
| Redis | 6379 | 6379 | — |
| MinIO S3 | 9000 | 9000 | http://localhost:9000 |
| Console MinIO | 9001 | 9001 | http://localhost:9001 |
| Mailpit SMTP | 1026 | 1025 | — |
| Mailpit web | 8025 | 8025 | http://localhost:8025 |
| pgAdmin | 8088 | 80 | http://localhost:8088 |
| PostgreSQL | non publié | 5432 | hôte Docker : `postgres` |
| Frontend Vite | 3000 | 3000 | http://localhost:3000 |

## Variables

`backend/.env` (le Compose force aussi ces valeurs pour la base et Redis) :

```env
APP_URL=http://localhost:8000
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=erp_eglise
DB_USERNAME=erp_user
DB_PASSWORD=erp_password
REDIS_HOST=redis
REDIS_PASSWORD=redis_password
REDIS_PORT=6379
MAIL_HOST=mailpit
MAIL_PORT=1025
AWS_ENDPOINT=http://minio:9000
AWS_ACCESS_KEY_ID=minio_access
AWS_SECRET_ACCESS_KEY=minio_secret
```

`frontend/.env` :

```env
VITE_API_URL=/api/v1
VITE_USE_MOCKS=false
```

Dans le conteneur frontend, Vite proxifie `/api` et `/sanctum` vers `http://backend:80`.

pgAdmin : `admin@erp-eglise.com` / `admin`. Dans pgAdmin, l'hôte du serveur est `postgres`, port `5432`, base `erp_eglise`, utilisateur `erp_user`.

## Lancement

Depuis la racine de ce dépôt uniquement :

```bash
docker compose up -d --build
docker compose exec backend php artisan migrate
```

Le frontend est le service `frontend` du même Compose : http://localhost:3000. Le premier démarrage installe les dépendances npm dans le conteneur.

Après un changement du `Dockerfile` backend (PHP-FPM + nginx), **reconstruire l’image une fois** avec `--build`. Les mises à jour de code PHP/React ne demandent pas de rebuild : le code est monté en volume. Les paquets Composer sont dans un volume Docker (`vendor`), comme `node_modules` : le premier démarrage du backend lance `composer install` dans le conteneur. Pour l’autocomplétion IDE sur la machine hôte, lancer aussi `composer install` dans `backend/` en local.

Arrêt de ce projet seulement, sans supprimer les volumes :

```bash
docker compose stop
```

Les migrations et seeds ne doivent viser que le conteneur `erp_centre_impact_chr-tienne-backend`.
