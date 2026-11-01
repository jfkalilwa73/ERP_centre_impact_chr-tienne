# ⛪ ERP Église - Centre Impact Chrétien

Plateforme numérique unique, centralisée et sécurisée pour structurer l'administration de l'Église, améliorer la circulation de l'information et renforcer le suivi des décisions, tout en respectant la mission pastorale.

##  Équipe & Responsabilités
- **Elie** : Lead Frontend & UX/UI (React, TypeScript, Design System)
- **Jean François (JF)** : Lead Backend & Sécurité (Laravel, API, RBAC, Sanctum)
- **Bienvenu** : Lead Base de données & Backend métier (PostgreSQL, Modèles, Intégrité, Audit)

## ️ Stack Technique
- **Frontend** : React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand
- **Backend** : Laravel 11, PHP 8.2, Laravel Sanctum, Spatie Permission, Owen-it Audit
- **Infrastructure** : Docker, PostgreSQL 16, Redis 7, MinIO (S3 compatible), Mailpit

## 🚀 Démarrage rapide

### 1. Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et lancé.
- [Node.js](https://nodejs.org/) (v20+) et npm installés.
- [Composer](https://getcomposer.org/) installé.

### 2. Cloner et configurer
```bash
git clone <URL_DU_DEPOT>
cd ERP_centre_impact_chr-tienne

# Copier les fichiers d'environnement
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

| **pgAdmin (DB)** | http://localhost:5050 | `admin@erp-eglise.local` / `admin` |