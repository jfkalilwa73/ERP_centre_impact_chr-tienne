import { PERMISSIONS } from '@/lib/permissions'
import { ROLE_CODES } from '@/lib/roleCodes'
import type { CurrentUser } from '@/types'

export function isMembreDge(user?: CurrentUser | null) {
  return user?.roles.some((role) => role.code === ROLE_CODES.MEMBRE_DGE) ?? false
}

export function isAdminFonctionnel(user?: CurrentUser | null) {
  const permissions = user?.permissions ?? []
  return permissions.includes(PERMISSIONS.COMPTES_CREATE) && permissions.includes(PERMISSIONS.ROLES_MANAGE)
}

/** La DGE pilote les superviseurs, qui accompagnent les chefs. L’admin voit ce pilotage. */
export function canSeePilotageDge(user?: CurrentUser | null) {
  return isMembreDge(user) || isAdminFonctionnel(user)
}

/** Lecture de toutes les unités : DGE, admin, pasteur. Pas un simple catalogue. */
export function canSeeAllUnits(user?: CurrentUser | null) {
  return canSeePilotageDge(user) || (user?.permissions.includes(PERMISSIONS.PASTORALE_NOTES) ?? false)
}
