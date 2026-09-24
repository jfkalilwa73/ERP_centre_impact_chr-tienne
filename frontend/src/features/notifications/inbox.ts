import { useAccessScope } from '@/features/auth/accessScope'
import { PERMISSIONS } from '@/lib/permissions'
import { useCurrentUser, useHasPermission } from '@/stores/authStore'

export function useInboxScope() {
  const user = useCurrentUser()
  const isAdmin =
    useHasPermission(PERMISSIONS.COMPTES_CREATE) && useHasPermission(PERMISSIONS.ROLES_MANAGE)
  const isPasteur = useHasPermission(PERMISSIONS.PASTORALE_NOTES)
  const { chefDepartementIds, superviseurDepartementIds } = useAccessScope()

  return {
    user,
    isAdmin,
    isPasteur,
    chefDepartementIds,
    superviseurDepartementIds,
  }
}
