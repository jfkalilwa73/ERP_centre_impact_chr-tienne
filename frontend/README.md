# Frontend — ERP Église (Phase 0)

React 19 + TypeScript + Vite, aligné sur le contrat `openapi/openapi-phase-0.yaml`.

## Démarrer

Depuis la racine du dépôt :

```bash
docker compose up -d
```

L'interface est servie par le conteneur `erp_centre_impact_chr-tienne-frontend` sur http://localhost:3000.

| Commande               | Rôle                                                   |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`          | Serveur de développement                               |
| `npm run test`         | Tests (Vitest + MSW + Testing Library)                 |
| `npm run typecheck`    | Vérification TypeScript stricte                        |
| `npm run lint`         | ESLint                                                 |
| `npm run build`        | Build de production                                    |
| `npm run api:types`    | Régénère `src/types/api.ts` depuis le contrat OpenAPI  |

## Le contrat fait autorité

`openapi/openapi-phase-0.yaml` est la copie du contrat officiel. Les types TypeScript
en sont **générés**, jamais écrits à la main :

```bash
npm run api:types
```

`src/types/index.ts` ne contient que des alias ergonomiques vers les schémas générés
(`Personne`, `LoginResponse`, `Site`…). Quand le contrat évolue, on régénère et on
corrige les erreurs de compilation qui en découlent.

## Connexion au backend

Le frontend est prêt à consommer le backend Laravel. La variable `VITE_USE_MOCKS`
est positionnée à `false` dans `.env` : toutes les requêtes partent vers le vrai serveur.

**Proxy Vite (développement)** : dans Docker, `vite.config.ts` redirige `/api/*` vers `http://backend:80`.
Le navigateur appelle http://localhost:3000, donc il n'y a pas d'appel direct vers un autre port.

```bash
# Depuis la racine du dépôt
docker compose up -d
```

**Réactiver les mocks** (backend indisponible) :
```bash
# Dans frontend/.env, changer :
VITE_USE_MOCKS=true
```

- La simulation est **refusée si `VITE_APP_ENV=production`**, quelle que soit la valeur
  de `VITE_USE_MOCKS`.
- Les handlers MSW et les comptes de démonstration restent dans `src/mocks/` pour les tests.


## Authentification

Le contrat n'expose **aucune route de renouvellement de token** : le refresh token
est géré côté Laravel sans endpoint public. Conséquences assumées côté React :

- le refresh token n'est ni stocké ni persisté, il serait inutilisable ;
- l'access token vit 1 heure ; passé ce délai la session est abandonnée et
  l'utilisateur revient sur l'écran de connexion ;
- tout `401` sur un appel authentifié ferme la session locale (`src/lib/apiClient.ts`).

## Organisation

```
src/
  components/layout/   Ossature applicative (en-tête, contenu)
  components/ui/       Primitives réutilisables (Button, Input, Alert…)
  features/<domaine>/  Appels API, hooks, schémas et écrans d'un domaine
  lib/                 Client axios, normalisation d'erreurs, client TanStack Query
  mocks/               Handlers MSW et jeux de données de démonstration
  pages/               Écrans sans logique de domaine propre
  routes/              Routage et gardes d'accès
  stores/              État global Zustand
  types/               Types générés depuis le contrat + alias
```

Conventions :

- les erreurs serveur passent par `ApiError` (`src/lib/apiError.ts`), qui normalise le
  schéma `ErrorResponse` du contrat en message affichable ;
- la validation de formulaire est faite avec Zod et doit refléter les contraintes du
  contrat, pas les inventer ;
- les libellés d'interface sont en français.
