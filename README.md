#  ERP Église — Centre Impact Chrétien

##  Présentation

L’**ERP Église — Centre Impact Chrétien** est une plateforme numérique centralisée destinée à améliorer la gestion administrative, organisationnelle et opérationnelle de l’Église.

L’objectif est de regrouper dans une même solution les différents processus de gestion, tout en garantissant :

*  la sécurité et la confidentialité des données ;
*  une architecture modulaire et évolutive ;
*  une bonne intégrité des données ;
*  la traçabilité des opérations importantes ;
*  une gestion précise des utilisateurs, rôles et permissions ;
*  une gestion centralisée des documents ;
*  de bonnes performances ;
*  une collaboration efficace entre les membres de l’équipe.

---

#  Équipe et responsabilités

| Membre                 | Responsabilité principale         | Technologies                        |
| ---------------------- | --------------------------------- | ----------------------------------- |
| **Elie**               | Frontend, UX/UI et Design System  | React, TypeScript, Tailwind CSS     |
| **Jean François (JF)** | Backend, API et sécurité          | Laravel, Sanctum, Spatie Permission |
| **Bienvenu**           | Base de données et logique métier | PostgreSQL, Laravel, Modèles, Audit |

Chaque membre possède un domaine principal, mais les différentes parties du projet restent interconnectées. Les décisions importantes concernant l’architecture doivent donc être communiquées à toute l’équipe.

---

#  Architecture technique

Le projet est organisé autour de trois grandes couches :

```text
┌──────────────────────────────┐
│       FRONTEND               │
│ React + TypeScript + Vite    │
│ Tailwind CSS + Zustand       │
└──────────────┬───────────────┘
               │
               │ API REST
               ▼
┌──────────────────────────────┐
│        BACKEND               │
│ Laravel + Sanctum            │
│ Spatie Permission + Audit    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│        DONNÉES               │
│ PostgreSQL + Redis           │
│ MinIO + Mailpit              │
└──────────────────────────────┘
```

Cette séparation permet à chaque partie de l’équipe de travailler de manière indépendante tout en conservant une architecture cohérente.

---

#  Stack technique

### Frontend

* React 18
* TypeScript
* Vite
* Tailwind CSS
* TanStack Query
* Zustand
* Radix UI

### Backend

* Laravel 11
* PHP 8.2
* Laravel Sanctum
* Spatie Permission
* Owen-it Audit

### Infrastructure

* Docker
* PostgreSQL 16
* Redis 7
* MinIO
* Mailpit

---

#  Pourquoi ces technologies ?

## React + TypeScript

React permet de construire une interface moderne et modulaire.

TypeScript ajoute un typage statique qui permet de détecter de nombreuses erreurs avant l’exécution du programme.

Le choix de React + TypeScript permet donc de construire progressivement une interface complexe tout en conservant un code organisé et maintenable.

---

## Laravel

Laravel constitue le socle du backend.

Il permet notamment de gérer :

* les API REST ;
* les utilisateurs ;
* l'authentification ;
* les modèles et relations ;
* les migrations ;
* les validations ;
* les services métier ;
* les files d'attente ;
* les notifications.

Laravel fournit ainsi une base structurée pour développer progressivement les différents modules de l’ERP.

---

## Sanctum

Laravel Sanctum est utilisé pour gérer l’authentification de l’application.

Il permet notamment de sécuriser les accès à l’API et de contrôler les utilisateurs authentifiés.

Le principe retenu est :

> **Aucun accès n’est autorisé par défaut.**

Chaque utilisateur doit être authentifié et disposer des permissions nécessaires pour accéder aux ressources concernées.

---

## Spatie Permission

Spatie Permission permet de mettre en place un système de **RBAC — Role-Based Access Control**.

Le principe est :

```text
Utilisateur
     │
     ▼
   Rôle
     │
     ▼
Permissions
     │
     ▼
Ressources / Actions
```

Exemple :

```text
Utilisateur : Jean

Rôle : Responsable

Permissions :
- consulter_membres
- modifier_membres
- consulter_rapports
```

Cela permet d'appliquer le principe du **moindre privilège** : un utilisateur ne reçoit que les droits nécessaires à sa fonction.

---

## PostgreSQL

PostgreSQL est utilisé comme système de gestion de base de données principal.

Il permet notamment de gérer efficacement :

* les relations entre les données ;
* les contraintes d’intégrité ;
* les transactions ;
* les UUID ;
* les données JSON/JSONB ;
* les index ;
* les mécanismes avancés de sécurité.

La base de données est organisée en **migrations modulaires** afin de faciliter son évolution et sa maintenance.

Exemple :

```text
create_erp_personne_table
create_erp_roles_permissions
create_erp_...
```

Chaque migration possède ainsi une responsabilité clairement définie.

---

## Owen-it Audit

Le système d’audit permet de conserver une trace des opérations importantes réalisées dans l’application.

Exemple :

```text
Utilisateur
    │
    │ modification
    ▼
Donnée
    │
    ▼
Journal d'audit
    │
    ├── utilisateur
    ├── date
    ├── action
    ├── ancienne valeur
    └── nouvelle valeur
```

Cela facilite le suivi des modifications et la traçabilité des opérations sensibles.

---

## Redis

Redis est utilisé pour améliorer les performances et préparer les fonctionnalités nécessitant un traitement asynchrone.

Il pourra notamment être utilisé pour :

* le cache ;
* les sessions ;
* les queues ;
* les notifications ;
* les traitements en arrière-plan.

---

## MinIO

MinIO fournit un stockage compatible avec l’API S3 tout en permettant un hébergement contrôlé sur notre propre infrastructure.

Il pourra être utilisé pour stocker :

* les documents ;
* les photos ;
* les fichiers administratifs ;
* les ressources de la GED.

Le choix de MinIO permet de garder la maîtrise de l’infrastructure de stockage.

---

## Mailpit

Mailpit est utilisé uniquement pour l’environnement de développement.

Il intercepte les emails générés par l’application afin que l’équipe puisse les tester sans envoyer de véritables messages aux membres.

Exemples :

* récupération de mot de passe ;
* notifications ;
* confirmation d'inscription ;
* emails administratifs.

---

#  Installation

## 1. Prérequis

Installer :

* Docker Desktop
* Node.js 20+
* npm
* PHP 8.2+
* Composer
* Git

---

## 2. Cloner le projet

```bash
git clone <URL_DU_DEPOT>
cd ERP_centre_impact_chr-tienne
```

---

## 3. Configurer les variables d’environnement

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Adapter ensuite les variables selon l’environnement local.

---

## 4. Démarrer Docker

Depuis la racine du projet :

```bash
docker compose up -d
```

Cette commande démarre les services nécessaires à l’environnement de développement.

---

## 5. Installer le frontend

```bash
cd frontend
npm install
cd ..
```

---

## 6. Installer le backend

```bash
cd backend
composer install
php artisan key:generate
php artisan migrate
cd ..
```

---

#  Lancer le projet

### Terminal 1 — Frontend

```bash
cd frontend
npm run dev
```

### Terminal 2 — Backend

```bash
cd backend
php artisan serve
```

---

#  Services locaux

| Service  | Adresse                 | Utilisation         |
| -------- | ----------------------- | ------------------- |
| Frontend | `http://localhost:5173` | Application React   |
| Backend  | `http://localhost:8000` | API Laravel         |
| MinIO    | `http://localhost:9001` | Gestion du stockage |
| Mailpit  | `http://localhost:8025` | Test des emails     |

---

#  Organisation Git

Le projet utilise une stratégie de branches simple afin d'éviter les conflits et de maintenir une version stable du projet.

## `main`

Branche de production et de référence.

Elle doit toujours contenir une version stable et fonctionnelle.

**Règle :**

> Ne jamais développer directement sur `main`.

---

## `develop`

Branche principale de développement.

Toutes les nouvelles fonctionnalités doivent partir de cette branche.

```text
main
  │
  └── develop
        │
        ├── feature/...
        ├── fix/...
        ├── chore/...
        └── docs/...
```

---

## Branches `feature/...`

Utilisées pour développer une nouvelle fonctionnalité.

Exemples :

```text
feature/auth
feature/gestion-membres
feature/dashboard
feature/gestion-documents
```

---

## Branches `fix/...`

Utilisées pour corriger un problème précis.

Exemples :

```text
fix/migration-personne
fix/authentication
fix/api-members
```

---

## Branches `chore/...`

Utilisées pour les tâches techniques qui ne correspondent pas directement à une fonctionnalité utilisateur.

Exemples :

```text
chore/docker
chore/configuration
chore/ci-cd
```

---

## Branches `docs/...`

Utilisées uniquement pour la documentation.

Exemple :

```text
docs/readme
```

---

#  Workflow de développement

Chaque développeur doit suivre le même processus :

```text
1. Récupérer develop
        │
        ▼
2. Créer sa branche
        │
        ▼
3. Développer
        │
        ▼
4. Tester
        │
        ▼
5. Commit + Push
        │
        ▼
6. Pull Request
        │
        ▼
7. Validation
        │
        ▼
8. Merge vers develop
        │
        ▼
9. Stabilisation
        │
        ▼
10. Merge vers main
```

### Exemple

```bash
git checkout develop
git pull origin develop

git checkout -b feature/gestion-membres
```

Après le développement :

```bash
git add .
git commit -m "feat: ajout gestion des membres"
git push -u origin feature/gestion-membres
```

Une **Pull Request** est ensuite créée vers `develop`.

---

#  Règles importantes

### 1. Ne pas travailler directement sur `main`

### 2. Toujours partir de `develop`

### 3. Une branche = une fonctionnalité ou une tâche précise

### 4. Tester avant de créer une Pull Request

### 5. Utiliser des messages de commit explicites

Exemples :

```text
feat: ajout module membres
fix: correction authentification
chore: mise à jour docker
docs: amélioration README
refactor: réorganisation des modèles
```

### 6. Ne jamais pousser les fichiers sensibles

Ne jamais publier :

```text
.env
.env.local
credentials
passwords
API keys
secrets
```

Ces informations doivent rester dans l'environnement local ou dans un système sécurisé prévu à cet effet.

---

#  Objectif de la Phase 0

La Phase 0 constitue le **socle technique du projet**.

Elle doit permettre à chaque membre de l'équipe de :

* récupérer le projet ;
* lancer l'environnement local ;
* accéder à la base de données ;
* lancer le frontend ;
* lancer le backend ;
* créer une branche ;
* développer une fonctionnalité ;
* effectuer une Pull Request.

Une fois ce socle validé, l'équipe peut commencer le développement des modules fonctionnels de l'ERP.

---

#  Équipe

**Elie** — Frontend / UX/UI
**Jean François** — Backend / Sécurité
**Bienvenu** — Base de données / Backend métier

> **Objectif commun : construire une plateforme fiable, sécurisée, maintenable et adaptée aux besoins du Centre Impact Chrétien.**
