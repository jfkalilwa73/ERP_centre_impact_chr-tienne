import { Outlet, useParams } from 'react-router-dom'
import { canAccessDepartementUnit } from '@/features/departements/roles'
import { usePersonneAffectations } from '@/features/personnes/hooks'
import { hasWideAccess, PERMISSIONS } from '@/lib/permissions'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { useCurrentUser, useHasPermission } from '@/stores/authStore'

/** Interface d'un département : lecture large, ou périmètre chef / adjoint / superviseur. */
export function DepartementAccessRoute() {
  const { departementId } = useParams<{ departementId: string }>()
  const user = useCurrentUser()
  const wide = hasWideAccess(user?.permissions ?? [])
  const canViewWide =
    wide &&
    (useHasPermission(PERMISSIONS.DEPARTEMENTS_READ) ||
      useHasPermission(PERMISSIONS.DEPARTEMENTS_UPDATE) ||
      useHasPermission(PERMISSIONS.DEPARTEMENTS_CREATE))
  const affectationsQuery = usePersonneAffectations(user?.personne.idPersonne)

  if (!canViewWide && affectationsQuery.isLoading) {
    return <p className="text-sm text-slate-500">Vérification de l'accès…</p>
  }

  const leadsThisDepartment = (affectationsQuery.data ?? []).some(
    (affectation) =>
      affectation.idDepartement === departementId &&
      affectation.actif &&
      canAccessDepartementUnit(affectation.fonction),
  )

  if (!canViewWide && !leadsThisDepartment) return <ForbiddenPage />

  return <Outlet />
}
