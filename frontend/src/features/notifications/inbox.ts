import { useAccessScope } from '@/features/auth/accessScope'
import { PERMISSIONS } from '@/lib/permissions'
import { ROLE_CODES } from '@/lib/roleCodes'
import { useCurrentUser, useHasPermission } from '@/stores/authStore'

export function useInboxScope() {
  const user = useCurrentUser()
  const isAdmin =
    useHasPermission(PERMISSIONS.COMPTES_CREATE) && useHasPermission(PERMISSIONS.ROLES_MANAGE)
  const isPasteur = useHasPermission(PERMISSIONS.PASTORALE_NOTES)
  const isDge = user?.roles.some((role) => role.code === ROLE_CODES.MEMBRE_DGE) ?? false
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
    chefDepartementIds: [...chefDepartementIds, ...chefFamilleIds],
    superviseurDepartementIds: [...superviseurDepartementIds, ...superviseurFamilleIds],
  }
}
