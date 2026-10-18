# 📋 Document d'information pour l'équipe — Sprint 1 ERP Église — Membres & Familles

**Date** : 18 septembre 2026  
**Auteur** : Bienvenu (Lead Database & Business Backend)  
**Version** : 1.0  
**Statut** : ✅ Validé et opérationnel  
**Destinataires** : Elie (Frontend), Jean François / JF (Backend), Bienvenu (Database)

---

## 🎯 Objectif de ce document

Ce document informe l'équipe de développement de l'état actuel de la base de données après le **Sprint 1** (couche métier "Membres & Familles"). Il détaille :
- Les **nouvelles tables** créées et leurs contraintes
- Les **données de test** disponibles après exécution du seeder
- Les **triggers et fonctionnalités** opérationnelles
- Comment **utiliser** ces données pour développer les prochaines fonctionnalités

---

## 1️⃣ Nouvelles tables créées (Sprint 1)

| Table | Description | Chapitre CDC | Clé primaire | FK principales |
|-------|-------------|--------------|--------------|----------------|
| `membre` | Extension métier de personne avec numéro membre, date d'intégration, statut membre | 3.2 | `id_membre` (UUID) | `id_personne` → `personne` (UNIQUE), `famille_impact_id` → `famille_impact` |
| `famille` | Regroupement familial (conjoints, enfants, responsables légaux) | 3.3 | `id_famille` (UUID) | `responsable_legal_id` → `personne` |
| `relation_familiale` | Liaison entre membres d'une même famille avec type de relation | 3.3 | `id_relation` (UUID) | `id_famille` → `famille`, `id_personne_1` → `personne`, `id_personne_2` → `personne` |
| `famille_impact` | Familles d'impact (groupes communautaires) avec responsable, zone, capacité | 4.1 | `id_famille` (UUID) | `responsable_id` → `personne`, `adjoint_id` → `personne` |
| `affecter_famille_impact` | Affectation des membres aux familles d'impact avec historique | 4.2 | `id_affectation` (UUID) | `id_membre` → `membre`, `id_famille_impact` → `famille_impact` |
| `presence_famille_impact` | Présences aux rencontres des familles d'impact | 4.3 | `id_presence` (UUID) | `id_affectation` → `affecter_famille_impact`, `enregistre_par` → `users` |
| `historique_statut_membre` | Historisation des changements de statut membre | 3.5 | `id_historique` (UUID) | `id_membre` → `membre`, `change_par` → `users` |

> La table `famille_impact` existait déjà (migration Phase 0, Sprint 1 famille) et a été étendue avec les colonnes : `responsable_id`, `adjoint_id`, `capacite_max`, `jour_reunion`, `heure_reunion`, `lieu_reunion`.

---

## 2️⃣ Triggers et contraintes

### 🔧 Triggers

| Trigger | Événement | Rôle |
|---------|-----------|------|
| `trg_numero_membre_auto` | `BEFORE INSERT` sur `membre` | Génère automatiquement un numéro membre unique (ex: `MEM-2026-0001`) si non fourni |
| `trg_historique_statut_membre` | `AFTER UPDATE` sur `membre` | Enregistre automatiquement chaque changement de statut dans `historique_statut_membre` |
| `trg_prevent_active_membre_delete` | `BEFORE DELETE` sur `membre` | Empêche la suppression d'un membre actif (soft-delete obligatoire) |
| `trg_membre_modification` | `BEFORE UPDATE` sur `membre` | Met à jour automatiquement `date_modification` (réutilise `update_date_modification()` de la Phase 0) |

### 🔒 Contraintes

- `numero_membre` : UNIQUE, NOT NULL
- `statut_membre` : CHECK `IN ('actif', 'inactif', 'en_attente', 'archive')`
- `type_relation` : CHECK `IN ('conjoint', 'parent', 'enfant', 'tuteur', 'frere_soeur', 'autre')`
- `nouveau_statut` (historique) : CHECK `IN ('actif', 'inactif', 'en_attente', 'archive')`
- `id_personne` sur `membre` : UNIQUE (une personne = un membre max)
- `affecter_famille_impact` : UNIQUE index sur `id_membre` WHERE `actif = TRUE` (un membre actif dans une seule famille d'impact à la fois)
- Toutes les clés étrangères : `ON DELETE RESTRICT` ou `ON DELETE SET NULL`

### 📇 Index stratégiques

- `membre` : `id_personne`, `numero_membre`, `statut_membre`, `famille_impact_id`
- `famille` : `responsable_legal_id`, `nom_famille`
- `relation_familiale` : `id_famille`, `id_personne_1`, `id_personne_2`
- `affecter_famille_impact` : `id_membre`, `id_famille_impact`, unique active
- `presence_famille_impact` : `id_affectation`, `date_reunion`
- `historique_statut_membre` : `id_membre`, `date_changement`
- `famille_impact` : `responsable_id`, `adjoint_id`

---

## 3️⃣ Données de test disponibles (après seeding)

Le seeder `Sprint1MembresFamillesSeeder` génère :

| Élément | Quantité | Détail |
|---------|----------|--------|
| Personnes | 65 | Noms/prénoms congolais, UPN/Kinshasa, sexes M/F |
| Membres | 65 | Liés 1:1 aux personnes, numéros auto-générés (MEM-2026-0001…) |
| Statuts membres | 65 | ~70% actif, ~20% inactif, ~10% en_attente |
| Familles | 25 | Nucléaires, monoparentales, élargies |
| Relations familiales | ~40-60 | Conjoints, parents-enfants, tuteurs |
| Familles d'impact | 6 | Avec responsables, adjoints, zones, capacités, jours/heures de réunion |
| Affectations familles d'impact | ~40 | Membres affectés aux familles d'impact |
| Présences | ~150-200 | 3 à 8 réunions par affectation |
| Changements de statut | 12 | Test de l'historisation automatique |

### Exemple de membre généré

| Champ | Valeur |
|-------|--------|
| `numero_membre` | `MEM-2026-0001` (auto-généré) |
| `date_integration` | Entre 2020 et 2026 |
| `statut_membre` | `actif` / `inactif` / `en_attente` |
| `famille_impact_id` | UUID de la famille d'impact affectée (ou null) |

---

## 4️⃣ Comment utiliser ces données pour le développement

### Pour Elie (Frontend)

#### Listes et Fiches
- **Liste des membres** : 65 membres disponibles avec statuts variés
- **Liste des familles** : 25 familles
- **Liste des familles d'impact** : 6 familles avec zones et responsables
- **Dashboard** : KPI basés sur les membres, familles, présences

#### Composants à créer
`DataTable`, `SearchInput`, `FilterDropdown`, `Pagination`, `Form`, `Modal`, `Badge`, `Card`, `DatePicker`, `DataTable`

#### Pages
- Liste des membres (recherche, filtres par statut, pagination)
- Fiche membre (formulaire détaillé, historique des statuts)
- Formulaire création/édition de membre
- Gestion des familles (ajout de membres de la famille)
- Gestion des familles d'impact et présences

### Pour JF (Backend)

#### Endpoints API à développer
- `POST /api/members` — Créer un membre
- `GET /api/members` — Liste des membres (filtres, pagination)
- `GET /api/members/{id}` — Fiche membre
- `PUT /api/members/{id}` — Modifier un membre
- `DELETE /api/members/{id}` — Supprimer un membre (soft-delete via trigger)
- `POST /api/members/{id}/merge` — Fusionner des doublons
- `GET /api/families` — Liste des familles
- `GET /api/families/{id}` — Fiche famille avec relations
- `GET /api/families-impact` — Liste des familles d'impact
- `GET /api/families-impact/{id}/presences` — Présences et taux de participation

#### Permissions
- `membres.create`, `membres.read`, `membres.update`, `membres.delete`

#### Relations Eloquent à tester
```php
// Récupérer le membre associé à une personne
$personne->membre

// Récupérer la personne d'un membre
$membre->personne

// Récupérer la famille d'impact d'un membre
$membre->familleImpact

// Récupérer l'historique des statuts d'un membre
$membre->historiqueStatuts

// Récupérer les affectations famille d'impact d'un membre
$membre->affectationsFamilleImpact

// Récupérer les relations familiales d'une famille
$famille->relations

// Récupérer le responsable légal d'une famille
$famille->responsableLegal

// Récupérer les personnes liées dans une relation familiale
$relation->personne1
$relation->personne2

// Récupérer le membre d'une affectation
$affectation->membre

// Récupérer qui a enregistré une présence
$presence->enregistrePar
```

### Pour Bienvenu (Database)

#### Requêtes de test
```sql
-- Test 1 : Vérifier la génération automatique du numéro membre
SELECT numero_membre, nom, prenom FROM membre m
JOIN personne p ON m.id_personne = p.id_personne
ORDER BY m.date_creation DESC LIMIT 5;

-- Test 2 : Vérifier les relations familiales
SELECT f.nom_famille, p1.nom AS personne1, p2.nom AS personne2, rf.type_relation
FROM relation_familiale rf
JOIN famille f ON rf.id_famille = f.id_famille
JOIN personne p1 ON rf.id_personne_1 = p1.id_personne
JOIN personne p2 ON rf.id_personne_2 = p2.id_personne
WHERE f.nom_famille = 'Famille Nuru';

-- Test 3 : Vérifier l'historique des statuts
SELECT m.numero_membre, p.nom, hs.ancien_statut, hs.nouveau_statut, hs.motif, hs.date_changement
FROM historique_statut_membre hs
JOIN membre m ON hs.id_membre = m.id_membre
JOIN personne p ON m.id_personne = p.id_personne
ORDER BY hs.date_changement DESC;

-- Test 4 : Vérifier les présences
SELECT fi.nom AS famille_impact, p.nom, pr.date_reunion, pr.present
FROM presence_famille_impact pr
JOIN affecter_famille_impact af ON pr.id_affectation = af.id_affectation
JOIN membre m ON af.id_membre = m.id_membre
JOIN personne p ON m.id_personne = p.id_personne
JOIN famille_impact fi ON af.id_famille_impact = fi.id_famille
ORDER BY pr.date_reunion DESC;

-- Test 5 : Taux de présence par famille d'impact
SELECT fi.nom,
       COUNT(pr.id_presence) AS total_reunions,
       SUM(CASE WHEN pr.present THEN 1 ELSE 0 END) AS presences,
       ROUND(SUM(CASE WHEN pr.present THEN 1 ELSE 0 END)::numeric / COUNT(pr.id_presence) * 100, 2) AS taux_presence
FROM famille_impact fi
JOIN affecter_famille_impact af ON fi.id_famille = af.id_famille
JOIN presence_famille_impact pr ON af.id_affectation = pr.id_affectation
WHERE af.actif = TRUE
GROUP BY fi.nom;

-- Test 6 : Vérifier qu'un membre actif ne peut pas être supprimé
DELETE FROM membre WHERE id_membre = '<UUID_MEMBRE_ACTIF>';  -- Doit lever une exception

-- Test 7 : Vérifier l'unicité du numéro membre
INSERT INTO membre (id_personne, numero_membre, date_integration, statut_membre)
VALUES ('<UUID_PERSONNE>', 'MEM-2026-0001', '2026-01-01', 'actif');  -- Doit lever une exception d'unicité
```

#### Maintenance
```bash
# Régénérer toutes les données (Phase 0 + Sprint 1)
docker compose exec backend php artisan migrate:fresh --seed

# Vider le cache
docker compose exec backend php artisan cache:clear

# Vérifier les migrations
docker compose exec backend php artisan migrate:status
```

---

## 5️⃣ Scénarios validés par le seeder

| # | Scénario | Tables mobilisées | Résultat attendu |
|---|----------|-------------------|------------------|
| 1 | Créer un membre avec numéro auto-généré | `membre` + `personne` | Numéro membre unique créé (ex: `MEM-2026-0001`) |
| 2 | Créer une famille nucléaire (père, mère, 2 enfants) | `famille` + `relation_familiale` + `personne` | 4 personnes liées dans 1 famille avec types de relation corrects |
| 3 | Affecter un membre à une famille d'impact | `affecter_famille_impact` + `membre` + `famille_impact` | Affectation créée avec `date_debut`, `actif=true` |
| 4 | Enregistrer une présence à une réunion | `presence_famille_impact` | Présence enregistrée avec `date`, `present=true/false` |
| 5 | Changer le statut d'un membre (actif → inactif) | `membre` + `historique_statut_membre` | Statut mis à jour + entrée dans l'historique |
| 6 | Tenter de supprimer un membre actif | Trigger `trg_prevent_active_membre_delete` | Exception levée, suppression bloquée |
| 7 | Tenter de créer un membre avec un numéro en double | `membre` (contrainte UNIQUE) | Exception de violation d'unicité |
| 8 | Vérifier l'historique complet d'un membre | `historique_statut_membre` + `audit_log` | Toutes les modifications tracées avec dates et auteurs |
| 9 | Lister les membres d'une famille d'impact | `affecter_famille_impact` + `membre` + `personne` | Liste correcte des membres actifs |
| 10 | Calculer le taux de présence d'une famille d'impact | `presence_famille_impact` + `affecter_famille_impact` | Statistiques correctes (ex: 85% de présence) |

---

## 6️⃣ Architecture technique — fichiers créés ou modifiés

### Migrations (7 nouveaux fichiers)
```
backend/database/migrations/
├── 2026_09_15_000010_create_erp_membre_table.php
├── 2026_09_15_000011_create_erp_famille_table.php
├── 2026_09_15_000012_create_erp_relation_familiale_table.php
├── 2026_09_15_000013_create_erp_affecter_famille_impact_table.php
├── 2026_09_15_000014_create_erp_presence_famille_impact_table.php
├── 2026_09_15_000015_create_erp_historique_statut_membre_table.php
└── 2026_09_15_000016_alter_erp_famille_impact_columns.php
```

### Modèles Eloquent (6 nouveaux fichiers)
```
backend/app/Models/
├── Membre.php
├── Famille.php
├── RelationFamiliale.php
├── AffecterFamilleImpact.php
├── PresenceFamilleImpact.php
└── HistoriqueStatutMembre.php
```

### Seeders (1 nouveau fichier + 1 modifié)
```
backend/database/seeders/
├── Sprint1MembresFamillesSeeder.php   (nouveau)
└── DatabaseSeeder.php                 (modifié : appelle aussi Sprint1MembresFamillesSeeder)
```

### Documentation (1 nouveau fichier)
```
backend/docs/
└── SPRINT1_DOCUMENTATION_EQUIPE.md   (ce document)
```

---

## 7️⃣ Points d'attention et bonnes pratiques

### 🔐 Sécurité
- Ne jamais exposer les UUID dans les URLs publiques (utiliser des slugs ou des IDs courts)
- Toujours vérifier les permissions côté serveur avant toute action sensible
- Historiser toutes les modifications critiques (statut, affectations, rôles)

### 📊 Qualité des données
- Dédoublonnage : Vérifier l'unicité des emails, télémails, numéros de membre
- Validation : Utiliser les contraintes CHECK de PostgreSQL
- Complétude : Rendre obligatoires les champs critiques (nom, prenom, date_integration)
- Normalisation : Standardiser les formats (téléphone, dates, adresses)

### 🚀 Performance
- Index stratégiques : Déjà créés sur les champs de recherche courants
- Pagination : Toujours paginer les listes (50-100 éléments par page)
- Eager Loading : Utiliser `with()` pour éviter les requêtes N+1
- Cache : Utiliser Redis pour les données fréquemment consultées

### 🔄 Collaboration
- Contrats d'API : Définir les endpoints avant de développer
- Tests : Écrire des tests unitaires et d'intégration
- Documentation : Mettre à jour ce document à chaque sprint
- Code Review : Chaque membre review le travail qui touche son domaine

---

## 8️⃣ Contact et support

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

## 📋 Résumé

✅ **Sprint 1 terminé et validé**  
✅ **7 tables créées** avec contraintes et index  
✅ **4 triggers fonctionnels** (numéro auto, historique statut, protection suppression, date_modification)  
✅ **6 modèles Eloquent** configurés avec relations  
✅ **Seeder exécutable** (10 scénarios validés)  
✅ **Données de test réalistes** (65 membres, 25 familles, 6 familles d'impact, UPN/Kinshasa)  

**Prochaine étape** : Sprint 2 — Organisation (affectation des membres aux départements)

---

**Document généré automatiquement** — Sprint 1 ERP Église — Septembre 2026  
**Version** : 1.0  
**Dernière mise à jour** : 18 septembre 2026
