# 📋 Document d'information pour l'équipe — Phase 0 ERP Église

**Date** : 18 septembre 2026  
**Auteur** : Bienvenu (Lead Database & Business Backend)  
**Version** : 1.0  
**Statut** : ✅ Validé et opérationnel  
**Destinataires** : Elie (Frontend), Jean François / JF (Backend), Bienvenu (Database)

---

## 🎯 Objectif de ce document

Ce document informe l'équipe de développement de l'état actuel de la base de données après la **Phase 0** (socle technique). Il détaille :
- Les **données de test** disponibles après exécution du seeder
- Les **fonctionnalités** déjà opérationnelles de la base de données
- Comment **utiliser** ces données pour développer les prochaines fonctionnalités

---

## 1️ Données de test disponibles (après seeding)

###  Compte de connexion principal

| Champ | Valeur |
|-------|--------|
| **Email** | `jean.nuru@eglise-upn.org` |
| **Mot de passe** | `Secret123!` |
| **Nom affiché** | Jean Nuru |
| **Statut** | `actif` |
| **MFA activé** | Non (`false`) |
| **Dernière connexion** | Non renseignée |

### 👤 Personne associée au compte

| Champ | Valeur |
|-------|--------|
| **Nom** | Nuru |
| **Prénom** | Jean |
| **Date de naissance** | 15 mai 1990 |
| **Sexe** | Masculin (M) |
| **Téléphone** | +243 819 999 999 |
| **Adresse** | Avenue 12, Quartier UPN, Commune de Mont-Ngafula, Kinshasa |
| **Statut** | `actif` |

### 🏛️ Sites (Multi-site)

#### Site 1 : Campus Principal (Mont-Ngafula)
| Champ | Valeur |
|-------|--------|
| **Code** | `SITE-UPN-01` |
| **Nom** | Campus Principal (Mont-Ngafula) |
| **Adresse** | Route de Matadi, Km 28 (Proximité UPN), Mont-Ngafula |
| **Ville** | Kinshasa |
| **Pays** | RDC |
| **Téléphone (accueil)** | +243 810 000 001 |
| **Actif** | Oui |

#### Site 2 : Annexe Lemba
| Champ | Valeur |
|-------|--------|
| **Code** | `SITE-LEMBA-02` |
| **Nom** | Annexe Lemba |
| **Adresse** | Avenue de l'Université, Quartier Kimwenza |
| **Ville** | Kinshasa |
| **Pays** | RDC |
| **Téléphone (accueil)** | +243 990 000 002 |
| **Actif** | Oui |

### 🏢 Département créé

| Champ | Valeur |
|-------|--------|
| **Code** | `DEPT-FIN` |
| **Nom** | Département Finance |
| **Mission** | Gestion des recettes, dîmes, offrandes et budgets institutionnels |
| **Site rattaché** | Campus Principal (Mont-Ngafula) |
| **Actif** | Oui |

### 🔗 Affectation de la personne

| Champ | Valeur |
|-------|--------|
| **Personne** | Jean Nuru |
| **Département** | Département Finance |
| **Fonction** | Responsable Départemental Finance |
| **Date de début** | Date du seeding |
| **Actif** | Oui |

###  Rôles et permissions (RBAC)

#### Rôle créé
| Champ | Valeur |
|-------|--------|
| **Code** | `ADMIN_FONCTIONNEL` |
| **Nom** | Administrateur Fonctionnel |
| **Description** | Gestion globale de l'ERP |
| **Niveau de confidentialité** | 3 (élevé) |
| **Actif** | Oui |

#### Permission créée
| Champ | Valeur |
|-------|--------|
| **Code** | `membres.read` |
| **Module** | `membres` |
| **Action** | `read` |
| **Description** | Consulter la liste des membres |
| **Actif** | Oui |

#### Chaîne de permissions validée
```
User (jean.nuru@eglise-upn.org)
  └── Rôle : ADMIN_FONCTIONNEL
        └── Permission : membres.read ✅
```

### 📊 Audit Log (Traçabilité)

Une action de test est enregistrée :

| Champ | Valeur |
|-------|--------|
| **User** | jean.nuru@eglise-upn.org |
| **Action** | `SEEDER_TEST` |
| **Entité type** | `personne` |
| **Entité ID** | UUID de Jean Nuru |
| **Nouvelles valeurs** | `{"nom": "Nuru", "statut": "actif", "commune": "Mont-Ngafula"}` |
| **IP** | 192.168.1.15 |
| **User Agent** | Laravel Seeder CLI / Windows 11 |

---

## 2️⃣ Ce que la base de données peut déjà faire

### ✅ Fonctionnalités opérationnelles

#### 1. **Gestion des identités (Personnes et Comptes)**
- ✅ Création de personnes avec informations complètes (nom, prénom, date de naissance, sexe, téléphone, adresse)
- ✅ Création de comptes de connexion (email, mot de passe hashé)
- ✅ Liaison 1:N entre personne et compte (une personne peut avoir plusieurs comptes)
- ✅ Gestion des statuts : `actif`, `inactif`, `archive`
- ✅ Sécurité : MFA (Multi-Factor Authentication) prêt à être activé
- ✅ Historisation : dates de création, dernière connexion, désactivation

#### 2. **Système RBAC (Rôles et Permissions)**
- ✅ Création de rôles fonctionnels (ex: `ADMIN_FONCTIONNEL`, `PASTEUR`, `CHEF_DEPT`)
- ✅ Création de permissions granulaires (module + action, ex: `membres.read`, `finance.approve`)
- ✅ Attribution de rôles aux comptes avec dates d'effet (historisation)
- ✅ Attribution de permissions aux rôles
- ✅ Niveaux de confidentialité (1 à 5)
- ✅ Vérification de permissions via relations Eloquent

#### 3. **Organisation Multi-Site**
- ✅ Création de sites (campus, paroisses, implantations)
- ✅ Chaque site peut avoir ses propres départements (flexibilité)
- ✅ Informations de contact par site (adresse, téléphone d'accueil)
- ✅ Gestion des statuts (actif/inactif)

#### 4. **Gestion des Départements**
- ✅ Création de départements rattachés à un site
- ✅ Affectation de personnes aux départements avec fonction occupée
- ✅ Historisation des affectations (dates de début/fin)
- ✅ Gestion des statuts (actif/inactif)

#### 5. **Traçabilité et Audit**
- ✅ Journal central des actions (`audit_log`)
- ✅ Traçabilité complète : qui a fait quoi, quand, depuis où
- ✅ Stockage des anciennes et nouvelles valeurs (JSONB)
- ✅ Indexation pour recherches rapides (par entité, par user, par date)

#### 6. **Gestion des Tokens Métier**
- ✅ Support de 12 types de tokens :
  - `refresh` (sessions longue durée)
  - `email_verification` (vérification email)
  - `password_reset` (réinitialisation mot de passe)
  - `invitation` (invitation nouveau membre)
  - `mfa` (code MFA temporaire)
  - `api_key` (clés API pour intégrations)
  - `webhook_secret` (secrets webhook)
  - `member_card` (carte membre numérique/QR)
  - `checkin` (QR check-in événement)
  - `document_share` (partage document temporaire)
  - `oauth` (sessions OAuth)
  - `one_time` (token à usage unique)
- ✅ Révocation automatique des tokens en cas de désactivation du compte
- ✅ Périmètre d'action configurable (scope JSONB)
- ✅ Limitation d'utilisation (nombre max d'utilisations)
- ✅ Expiration automatique
- ✅ Traçabilité (IP, user agent, date de dernière utilisation)

#### 7. **Intégrité et Sécurité des Données**
- ✅ **Trigger de protection** : Empêche la suppression d'une personne active (soft-delete obligatoire)
- ✅ **Trigger de mise à jour automatique** : `date_modification` mise à jour automatiquement
- ✅ **Contraintes d'intégrité** : Clés étrangères, unicité, CHECK constraints
- ✅ **Index stratégiques** : Performance optimisée pour les recherches courantes
- ✅ **UUID** : Clés primaires en UUID pour sécurité IDOR et portabilité

#### 8. **Architecture Technique**
- ✅ PostgreSQL 16 avec Docker
- ✅ Migrations versionnées (9 migrations Phase 0)
- ✅ Modèles Eloquent Laravel configurés
- ✅ Relations entre modèles (BelongsTo, HasMany, BelongsToMany)
- ✅ Casting automatique des types (JSONB, datetime, boolean)

---

## 3️⃣ Comment utiliser ces données pour le développement

### Pour Elie (Frontend)

#### 🔐 Page de Login
- **Email** : `jean.nuru@eglise-upn.org`
- **Mot de passe** : `Secret123!`
- Testez l'authentification et la redirection vers le dashboard

#### 📋 Listes et Fiches
- **Liste des membres** : 1 membre disponible (Jean Nuru)
- **Liste des départements** : 1 département (Finance) rattaché au Campus Principal
- **Liste des sites** : 2 sites (Campus Principal + Annexe Lemba)
- **Dashboard** : Affichez les KPI basés sur ces données

#### 🎨 Design System
- Commencez à créer les composants réutilisables :
  - `Button`, `Input`, `Select`, `Modal`, `Table`, `Pagination`
  - `Badge`, `Card`, `Dropdown`, `Tabs`, `Toast`, `Alert`
  - `Form`, `DatePicker`, `FileUpload`, `DataTable`

### Pour JF (Backend)

####  Authentification et Autorisation
- Le compte est actif, MFA désactivé
- L'utilisateur a le rôle `ADMIN_FONCTIONNEL` avec la permission `membres.read`
- Testez les middlewares d'authentification et d'autorisation

#### 📡 Endpoints API à développer
- `POST /api/auth/login` — Authentification
- `GET /api/members` — Liste des membres (permission `membres.read`)
- `GET /api/departments` — Liste des départements
- `GET /api/sites` — Liste des sites
- `GET /api/audit-logs` — Journal d'audit (permission `audit.read`)

#### 🔗 Relations à tester
```php
// Récupérer la personne associée à un user
$user->personne

// Récupérer les rôles d'un user
$user->rolesMetier

// Récupérer les permissions d'un rôle
$role->permissions

// Récupérer les départements d'un site
$site->departements

// Récupérer les affectations d'un département
$departement->affectations
```

#### 🛡️ Sécurité
- Testez la protection contre la suppression d'une personne active
- Testez la révocation automatique des tokens en cas de désactivation
- Validez les permissions avant chaque action sensible

### Pour Bienvenu (Database)

#### 📊 Requêtes de test
```sql
-- Voir les tokens actifs
SELECT * FROM vue_tokens_actifs;

-- Voir l'historique d'une personne
SELECT * FROM audit_log WHERE id_entite = '<UUID_PERSONNE>';

-- Voir les affectations départementales
SELECT p.nom, d.nom, ad.fonction 
FROM affecter_departement ad
JOIN personne p ON ad.id_personne = p.id_personne
JOIN departement d ON ad.id_departement = d.id_departement;

-- Voir les permissions d'un user
SELECT u.email, r.code AS role, p.code AS permission
FROM users u
JOIN affecter_role_metier arm ON u.id = arm.user_id
JOIN role_metier r ON arm.id_role = r.id_role
JOIN attribuer_permission ap ON r.id_role = ap.id_role
JOIN permission_metier p ON ap.id_permission = p.id_permission
WHERE u.email = 'jean.nuru@eglise-upn.org';
```

#### 🔧 Maintenance
- **Régénérer les données** : `docker compose exec backend php artisan migrate:fresh --seed`
- **Vider le cache** : `docker compose exec backend php artisan cache:clear`
- **Vérifier les migrations** : `docker compose exec backend php artisan migrate:status`

---

## 4️⃣ Scénarios validés par le seeder

| # | Scénario | Statut | Tables mobilisées |
|---|----------|--------|-------------------|
| 1 | Créer une personne | ✅ | `personne` |
| 2 | Créer un compte de connexion | ✅ | `users` + `personne` |
| 3 | Créer un rôle (`ADMIN_FONCTIONNEL`) | ✅ | `role_metier` |
| 4 | Créer une permission (`membres.read`) | ✅ | `permission_metier` |
| 5 | Attribuer un rôle à un compte | ✅ | `affecter_role_metier` |
| 6 | Attribuer des permissions à un rôle | ✅ | `attribuer_permission` |
| 7 | Créer un site avec numéro d'accueil | ✅ | `site` |
| 8 | Créer un département rattaché à un site | ✅ | `departement` + `site` |
| 9 | Affecter une personne à un département | ✅ | `affecter_departement` |
| 10 | Tracer une action (audit log) | ✅ | `audit_log` |
| 11 | Vérifier qu'un compte a un droit (chaîne RBAC) | ✅ | `users` → `affecter_role_metier` → `role_metier` → `attribuer_permission` → `permission_metier` |
| 12 | Empêcher la suppression d'une personne active (trigger) | ✅ | Trigger `trg_prevent_active_personne_delete` |

---

## 5️ Prochaines étapes (Sprint 1)

### 🎯 Objectifs du Sprint 1 : Utilisateurs & Membres

#### Pour Bienvenu (Database)
- **Tables à créer** : `membre`, `famille`, `relation_familiale`
- **Fonctionnalités** :
  - Gestion des numéros de membre
  - Dates d'intégration à l'église
  - Statuts membres (actif, inactif, en attente, archive)
  - Relations familiales (conjoint, enfants, responsables légaux)
  - Dédoublonnage (nom, téléphone, email)
  - Historisation des changements de statut
- **Données de test** : ~50-100 membres, familles, relations

#### Pour JF (Backend)
- **Endpoints API** :
  - `POST /api/members` — Créer un membre
  - `GET /api/members` — Liste des membres (avec filtres, pagination)
  - `GET /api/members/{id}` — Fiche membre
  - `PUT /api/members/{id}` — Modifier un membre
  - `DELETE /api/members/{id}` — Supprimer un membre (soft-delete)
  - `POST /api/members/{id}/merge` — Fusionner des doublons
- **Permissions** : `membres.create`, `membres.read`, `membres.update`, `membres.delete`

#### Pour Elie (Frontend)
- **Pages à créer** :
  - Liste des membres (tableau avec recherche, filtres, pagination)
  - Fiche membre (formulaire détaillé)
  - Formulaire de création/édition de membre
  - Gestion des familles (ajout de membres de la famille)
- **Composants** : `DataTable`, `SearchInput`, `FilterDropdown`, `Pagination`, `Form`, `Modal`

---

## 6️⃣ Comment régénérer les données de test

Si la base est corrompue ou si vous voulez repartir de zéro :

```bash
# Via Docker (recommandé)
docker compose exec backend php artisan migrate:fresh --seed

# Ou en local (si PHP installé sur Windows)
php artisan migrate:fresh --seed
```

⚠️ **Attention** : Cette commande supprime **toutes les données** et recrée le schéma + les données de test.

---

## 7️⃣ Architecture technique de la Phase 0

### 📦 Stack technique
- **Base de données** : PostgreSQL 16 (Docker)
- **Cache** : Redis 7 (Docker) — optionnel, peut utiliser `file` en local
- **Stockage fichiers** : MinIO/S3 (Docker)
- **Emails** : Mailpit (Docker) — pour le développement
- **Backend** : Laravel (PHP) — Docker
- **Frontend** : React + TypeScript (Node.js) — Docker

### ️ Structure des fichiers
```
backend/
├── app/
│   └── Models/
│       ├── User.php
│       ├── Personne.php
│       ├── RoleMetier.php
│       ├── PermissionMetier.php
│       ├── AffecterRoleMetier.php
│       ├── AttribuerPermission.php
│       ├── Site.php
│       ├── Departement.php
│       ├── AffecterDepartement.php
│       ├── TokenMetier.php
│       └── AuditLog.php
├── database/
│   ├── migrations/
│   │   ├── 2026_09_15_000000_create_users_table.php
│   │   ├── 2026_09_15_000001_create_erp_core_functions.php
│   │   ├── 2026_09_15_000002_create_cache_table.php
│   │   ├── 2026_09_15_000003_create_jobs_table.php
│   │   ├── 2026_09_15_000004_create_erp_personne_table.php
│   │   ├── 2026_09_15_000005_create_erp_tokens_metier_table.php
│   │   ├── 2026_09_15_000006_create_erp_roles_permissions.php
│   │   ├── 2026_09_15_000007_create_erp_organisation.php
│   │   └── 2026_09_15_000008_create_erp_audit_logs.php
│   └── seeders/
│       ├── DatabaseSeeder.php
│       └── Phase0ScenarioSeeder.php
── docs/
    └── PHASE0_DOCUMENTATION_EQUIPE.md (ce document)
```

### 🗄️ Tables créées (Phase 0)

| Table | Description | Enregistrements (après seeding) |
|-------|-------------|--------------------------------|
| `users` | Comptes de connexion | 1 |
| `personne` | Identités physiques | 2 (Jean Nuru + Test Trigger) |
| `token_metier` | Tokens métier | 0 (créés à la connexion) |
| `role_metier` | Rôles fonctionnels | 1 |
| `permission_metier` | Permissions atomiques | 1 |
| `affecter_role_metier` | Liaison compte ↔ rôle | 1 |
| `attribuer_permission` | Liaison rôle ↔ permission | 1 |
| `site` | Implantations / Campus | 2 |
| `departement` | Unités organisationnelles | 1 |
| `affecter_departement` | Liaison personne ↔ département | 1 |
| `audit_log` | Traçabilité des actions | 1 |

---

## 8️⃣ Points d'attention et bonnes pratiques

### 🔐 Sécurité
- **Ne jamais stocker de mots de passe en clair** (toujours hashés avec bcrypt)
- **Ne jamais exposer les UUID** dans les URLs publiques (utiliser des slugs ou des IDs courts)
- **Toujours vérifier les permissions** côté serveur avant toute action sensible
- **Historiser toutes les modifications critiques** (statut, affectations, rôles)

### 📊 Qualité des données
- **Dédoublonnage** : Vérifier l'unicité des emails, téléphones, codes
- **Validation** : Utiliser les contraintes CHECK de PostgreSQL (ex: sexe IN ('M', 'F'))
- **Complétude** : Rendre obligatoires les champs critiques (nom, prenom, email)
- **Normalisation** : Standardiser les formats (téléphone, dates, adresses)

### 🚀 Performance
- **Index stratégiques** : Déjà créés sur les champs de recherche courants
- **Pagination** : Toujours paginer les listes (50-100 éléments par page)
- **Eager Loading** : Utiliser `with()` pour éviter les requêtes N+1
- **Cache** : Utiliser Redis pour les données fréquemment consultées

### 🔄 Collaboration
- **Contrats d'API** : Définir les endpoints avant de développer
- **Tests** : Écrire des tests unitaires et d'intégration
- **Documentation** : Mettre à jour ce document à chaque sprint
- **Code Review** : Chaque membre review le travail qui touche son domaine

---

## 9️ Contact et support

Pour toute question sur les données ou la structure de la base :
- **Bienvenu** — Lead Database & Business Backend
- Canal : `#backend-db` sur Slack/Discord

Pour les questions API :
- **Jean François (JF)** — Lead Backend & Security
- Canal : `#backend-api` sur Slack/Discord

Pour les questions Frontend :
- **Elie** — Lead Full-Stack & Frontend
- Canal : `#frontend` sur Slack/Discord

---

##  Résumé

✅ **Phase 0 terminée et validée**  
✅ **8/8 scénarios de test passés avec succès**  
✅ **Base de données prête pour le Sprint 1**  
✅ **Données de test réalistes et contextualisées (UPN/Kinshasa)**  
✅ **Architecture technique solide et évolutive**

**Prochaine étape** : Sprint 1 — Utilisateurs & Membres (tables `membre`, `famille`, `relation_familiale`)

---

**Document généré automatiquement** — Phase 0 ERP Église — Septembre 2026  
**Version** : 1.0  
**Dernière mise à jour** : 18 septembre 2026