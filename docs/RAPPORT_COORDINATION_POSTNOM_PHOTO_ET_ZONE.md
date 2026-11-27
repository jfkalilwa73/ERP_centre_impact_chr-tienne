# Rapport de coordination - périmètre personne et familles d'impact

Date: 27 novembre 2026

## Objet

Ce rapport décrit les changements réalisés sur le périmètre `postnom`, photo de profil et retrait de `zone`, ainsi que les actions attendues des responsables API et frontend.

## Modifications appliquées

### Base de données

- `zone` a été retirée de la création de la table `familles_impact`.
- Une migration corrective a été ajoutée pour les bases déjà migrées.
- `postnom VARCHAR(100) NULL` a été ajouté à la table `personne`.
- `photo_url VARCHAR(500) NULL` reste le champ de stockage logique de la photo.

### Backend API

- Le modèle `Personne` porte `postnom`.
- La création, la modification, la recherche et la ressource personne prennent en charge `postnom`.
- Le modèle `FamilleImpact` et son seeder ne portent plus `zone`.
- Les requêtes, validations et ressources famille d’impact ont été alignées sur l’absence de `zone`.
- Un endpoint authentifié téléverse une photo :
  - `POST /api/v1/personnes/{personneId}/photo`
- Une URL signée permet sa lecture :
  - `GET /api/v1/personnes/{personneId}/photo`
- Formats acceptés : JPEG, PNG et WebP.
- Taille maximale : 5 Mo.
- Le fichier est stocké sur le disque Laravel configuré.
- Le chemin de stockage est enregistré dans `photo_url`.
- Une ancienne photo interne au même dossier personne est supprimée lors du remplacement.
- La suppression définitive de la personne supprime aussi sa photo stockée.

### Contrat API et frontend

- Le contrat OpenAPI source a été complété avec `postnom`.
- Le contrat OpenAPI documente maintenant les opérations d’upload et de lecture photo.
- Les types frontend ont été régénérés depuis OpenAPI.
- Le formulaire personne contient maintenant le champ `postnom`.
- Les noms affichés dans les fiches, la liste, l’impression et les avatars incluent le postnom.
- La recherche, les doublons et les initiales prennent en compte le postnom.
- L’interface téléverse réellement l’image avec un formulaire `multipart/form-data`.
- La réponse API actualise le cache React Query et affiche l’URL signée.
- Les fichiers locaux conservés dans le navigateur ne sont plus utilisés comme persistance finale.

## Comportement de la photo

`photo_url` contient un chemin interne tel que `personnes/{UUID}/fichier.png`, et non l’octet du fichier.

La ressource API transforme ce chemin interne en URL temporairement signée valable sept jours.

Les anciennes valeurs `photo_url` qui ne commencent pas par `personnes/{UUID}/` restent compatibles et sont retournées telles quelles.

## Actions pour le responsable API

1. Appliquer les migrations dans l’ordre prévu.
2. Vérifier que `personne.postnom` existe après migration.
3. Vérifier que `familles_impact.zone` n’existe plus.
4. Configurer `FILESYSTEM_DISK` ou `S3`/MinIO selon l’environnement.
5. Vérifier les permissions d’écriture du disque configuré.
6. Tester les trois scénarios photo :
   - upload valide;
   - fichier invalide ou supérieur à 5 Mo;
   - session absente.
7. Vérifier que la route de lecture accepte uniquement une signature valide.
8. Publier les migrations et redéployer les routes avant de tester le frontend.

## Actions pour le responsable frontend

1. Utiliser `postnom?: string` dans les payloads de création/modification.
2. Afficher le postnom dans les vues personne.
3. Ne conserver aucune écriture locale comme seule source de la photo.
4. Utiliser `POST /personnes/{personneId}/photo` pour toute modification.
5. Utiliser la `photoUrl` retournée par l’API pour l’affichage.
6. Gérer les cas 401, 404 et 422.
7. Régénérer les types avec `npm run api:types` après toute évolution OpenAPI.

## Références à `zone` encore présentes hors base

La base et le backend ne renvoient plus `zone`.

L’alignement frontend complet peut nécessiter un traitement séparé des anciens types, formulaires, fixtures et composants qui peuvent encore référencer `zone`. Tant que ces références restent dans le frontend, elles doivent être retirées ou démontrées comme étant purement obsolètes; elles ne doivent pas être renvoyées comme champ API.

## Tests

### Frontend réussis

- `npm test -- src/features/personnes/api.test.ts` : 11 tests réussis.
- `npm run typecheck` : réussi.
- `npm run api:types` : génération des types réussie.
- PHP : syntaxe vérifiée pour le contrôleur photo, sa requête et les tests ciblés.

### Contraintes d’environnement

- Les tests PHPUnit photo se sont arrêtés avant les assertions avec `SQLSTATE[08006]` : l’hôte PostgreSQL `postgres` n’est pas résolu dans l’environnement courant.
- Docker Desktop/PostgreSQL doit être disponible pour exécuter les trois tests Feature photo.
- Le lint ciblé conserve des remarques préexistantes dans `PersonneDetailPage.tsx` et `PersonneFormDialog.tsx`. Les hooks de permissions dans `PersonneDetailPage.tsx` ont été corrigés pour éviter les appels conditionnels.

## Validation minimale avant mise en production

1. Exécuter les migrations avec une sauvegarde préalable.
2. Exécuter les tests PHPUnit Identité.
3. Exécuter les tests Vitest personne.
4. Vérifier la création et la modification avec `postnom`.
5. Vérifier l’upload JPEG/PNG/WebP.
6. Vérifier le remplacement et la suppression de l’ancienne photo.
7. Vérifier que `zone` n’est plus attendue par aucun appel API.
