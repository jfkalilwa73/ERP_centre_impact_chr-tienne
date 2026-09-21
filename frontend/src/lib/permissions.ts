/**
 * Codes de permission utilisés par l'interface.
 * Le contrat n'énumère pas le catalogue : on s'aligne sur les exemples
 * (`membres.read`, `roles.manage`, `audit.read`) et le motif `module.action`.
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
  ROLES_MANAGE: 'roles.manage',
  AUDIT_READ: 'audit.read',
} as const

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
