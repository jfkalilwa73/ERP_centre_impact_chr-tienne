/**
 * Codes de permission utilisés par l'interface et le jeu de démonstration.
 * Motif `module.action` du contrat Phase 0. Les modules non encore livrés
 * sont déjà au catalogue pour préparer les rôles du cahier des charges.
 */
export const PERMISSIONS = {
  MEMBRES_READ: 'membres.read',
  MEMBRES_CREATE: 'membres.create',
  MEMBRES_UPDATE: 'membres.update',
  MEMBRES_DELETE: 'membres.delete',
  COMPTES_READ: 'comptes.read',
  COMPTES_CREATE: 'comptes.create',
  COMPTES_UPDATE: 'comptes.update',
  COMPTES_DELETE: 'comptes.delete',
  SITES_READ: 'sites.read',
  SITES_CREATE: 'sites.create',
  SITES_UPDATE: 'sites.update',
  SITES_DELETE: 'sites.delete',
  DEPARTEMENTS_READ: 'departements.read',
  DEPARTEMENTS_CREATE: 'departements.create',
  DEPARTEMENTS_UPDATE: 'departements.update',
  DEPARTEMENTS_DELETE: 'departements.delete',
  FAMILLES_READ: 'familles.read',
  FAMILLES_CREATE: 'familles.create',
  FAMILLES_UPDATE: 'familles.update',
  FAMILLES_DELETE: 'familles.delete',
  ROLES_READ: 'roles.read',
  ROLES_MANAGE: 'roles.manage',
  AUDIT_READ: 'audit.read',
  SYSTEME_MANAGE: 'systeme.manage',
  PASTORALE_READ: 'pastorale.read',
  PASTORALE_CREATE: 'pastorale.create',
  PASTORALE_NOTES: 'pastorale.notes',
  PASTORALE_RDV: 'pastorale.rdv',
  ACTIVITES_READ: 'activites.read',
  ACTIVITES_CREATE: 'activites.create',
  ACTIVITES_UPDATE: 'activites.update',
  BUDGET_READ: 'budget.read',
  BUDGET_REQUEST: 'budget.request',
  RAPPORTS_READ: 'rapports.read',
  RAPPORTS_CREATE: 'rapports.create',
  RAPPORTS_CONSOLIDATE: 'rapports.consolidate',
  EQUIPES_READ: 'equipes.read',
  EQUIPES_MANAGE: 'equipes.manage',
  OBJECTIFS_READ: 'objectifs.read',
  OBJECTIFS_MANAGE: 'objectifs.manage',
  DEMANDES_READ: 'demandes.read',
  DEMANDES_CREATE: 'demandes.create',
  ALERTES_READ: 'alertes.read',
  PERFORMANCES_READ: 'performances.read',
  FINANCE_READ: 'finance.read',
  FINANCE_MANAGE: 'finance.manage',
  CAISSE_READ: 'caisse.read',
  CAISSE_MANAGE: 'caisse.manage',
  RH_READ: 'rh.read',
  RH_MANAGE: 'rh.manage',
  RH_SALAIRES: 'rh.salaires',
  ACHATS_READ: 'achats.read',
  ACHATS_MANAGE: 'achats.manage',
  LOGISTIQUE_READ: 'logistique.read',
  LOGISTIQUE_MANAGE: 'logistique.manage',
  PROJETS_READ: 'projets.read',
  PROJETS_MANAGE: 'projets.manage',
  PROTOCOLE_READ: 'protocole.read',
  PROTOCOLE_MANAGE: 'protocole.manage',
  SECRETARIAT_READ: 'secretariat.read',
  SECRETARIAT_MANAGE: 'secretariat.manage',
  ARCHIVES_READ: 'archives.read',
  ARCHIVES_MANAGE: 'archives.manage',
  TECHNIQUE_READ: 'technique.read',
  TECHNIQUE_MANAGE: 'technique.manage',
} as const

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/**
 * Droits d'organisation : hors périmètre d'un seul chef.
 * `membres.read` suffit (pasteur, DGE) : pas besoin d'ouvrir l'administration.
 */
export const WIDE_ACCESS_PERMISSIONS: PermissionCode[] = [
  PERMISSIONS.MEMBRES_READ,
  PERMISSIONS.FAMILLES_READ,
  PERMISSIONS.COMPTES_READ,
  PERMISSIONS.ROLES_READ,
  PERMISSIONS.ROLES_MANAGE,
  PERMISSIONS.AUDIT_READ,
]

export function hasWideAccess(permissions: readonly string[]) {
  return WIDE_ACCESS_PERMISSIONS.some((code) => permissions.includes(code))
}

/** Secrets métier : jamais accordés à l'admin technique, ni par héritage hiérarchique. */
export const CONFIDENTIAL_PERMISSIONS: PermissionCode[] = [
  PERMISSIONS.PASTORALE_NOTES,
  PERMISSIONS.RH_SALAIRES,
  PERMISSIONS.FINANCE_MANAGE,
]
