const MODULE_LABELS: Record<string, string> = {
  membres: 'Personnes',
  comptes: 'Comptes',
  sites: 'Sites',
  departements: 'Départements',
  familles: "Familles d'impact",
  roles: 'Rôles et droits',
  audit: 'Journal des actions',
  systeme: 'Réglages techniques',
  pastorale: 'Suivi pastoral',
  activites: 'Activités',
  budget: 'Budget',
  rapports: 'Rapports',
  equipes: 'Équipes',
  objectifs: 'Objectifs',
  demandes: 'Demandes',
  alertes: 'Alertes',
  performances: 'Performances',
  finance: 'Finances',
  caisse: 'Caisse',
  rh: 'Ressources humaines',
  achats: 'Achats',
  logistique: 'Logistique',
  projets: 'Projets',
  protocole: 'Protocole',
  secretariat: 'Secrétariat',
  archives: 'Archives',
  technique: 'Technique',
}

const ACTION_LABELS: Record<string, string> = {
  read: 'Consulter',
  create: 'Créer',
  update: 'Modifier',
  delete: 'Supprimer',
  manage: 'Gérer',
  request: 'Demander une dépense',
  consolidate: 'Voir le consolidé',
  notes: 'Lire les notes confidentielles',
  rdv: 'Gérer les rendez-vous',
  salaires: 'Voir les salaires',
  print: 'Imprimer',
  export: 'Exporter',
  archive: 'Archiver',
}

export const MODULE_OPTIONS = Object.entries(MODULE_LABELS).sort((left, right) =>
  left[1].localeCompare(right[1], 'fr'),
)

export const ACTION_OPTIONS = Object.entries(ACTION_LABELS).sort((left, right) =>
  left[1].localeCompare(right[1], 'fr'),
)

export function moduleLabel(module: string) {
  return MODULE_LABELS[module] ?? module
}

export function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action
}

type PermissionLike = {
  code: string
  module?: string
  action?: string
  description?: string
}

export function permissionLabel(permission: PermissionLike) {
  if (permission.description?.trim()) return permission.description.trim()
  const [module = '', action = ''] = permission.code.split('.')
  return `${actionLabel(permission.action ?? action)} — ${moduleLabel(permission.module ?? module)}`
}

export function permissionLabelFromCode(code: string) {
  const [module = '', action = ''] = code.split('.')
  return `${actionLabel(action)} — ${moduleLabel(module)}`
}

export function permissionSearchHaystack(permission: PermissionLike) {
  const [module = '', action = ''] = permission.code.split('.')
  return [
    permission.code,
    permission.module ?? module,
    permission.action ?? action,
    permission.description,
    moduleLabel(permission.module ?? module),
    actionLabel(permission.action ?? action),
    permissionLabel(permission),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}
