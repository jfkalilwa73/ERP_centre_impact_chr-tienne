import { useAccessScope } from '@/features/auth/accessScope'
import { PERMISSIONS } from '@/lib/permissions'
import { ROLE_CODES } from '@/lib/roleCodes'
import { useCurrentUser, useHasPermission } from '@/stores/authStore'

export function useInboxScope() {
  const user = useCurrentUser()
  const isAdmin =
    useHasPermission(PERMISSIONS.COMPTES_CREATE) && useHasPermission(PERMISSIONS.ROLES_MANAGE)
  const isPasteur =
    useHasPermission(PERMISSIONS.PASTORALE_NOTES) ||
    (user?.roles.some((role) => role.code === ROLE_CODES.PASTEUR) ?? false)
  const isDge = user?.roles.some((role) => role.code === ROLE_CODES.MEMBRE_DGE) ?? false
  const isConseilPastoral = user?.roles.some((role) => role.code === ROLE_CODES.CONSEIL_PASTORAL) ?? false
  const isGestionPersonnes = useHasPermission(PERMISSIONS.MEMBRES_CREATE)
  const {
    chefDepartementIds,
    superviseurDepartementIds,
    chefFamilleIds,
    superviseurFamilleIds,
  } = useAccessScope()

  return {
    user,
    isAdmin,
    isPasteur,
    isDge,
    isConseilPastoral,
    isGestionPersonnes,
    chefDepartementIds: [...chefDepartementIds, ...chefFamilleIds],
    superviseurDepartementIds: [...superviseurDepartementIds, ...superviseurFamilleIds],
  }
}
