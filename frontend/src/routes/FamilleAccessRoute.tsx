import { Outlet, useParams } from 'react-router-dom'
import { canSeeAllUnits } from '@/features/auth/orgRoles'
import { canAccessFamilleUnit } from '@/features/familles/roles'
import { usePersonneFamilles } from '@/features/personnes/hooks'
import { PERMISSIONS } from '@/lib/permissions'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { useCurrentUser, useHasPermission } from '@/stores/authStore'

/** Interface d'une famille : DGE / admin / pasteur, ou chef / adjoint de cette famille. */
export function FamilleAccessRoute() {
  const { familleId } = useParams<{ familleId: string }>()
  const user = useCurrentUser()
  const canView =
    canSeeAllUnits(user) ||
    useHasPermission(PERMISSIONS.FAMILLES_UPDATE) ||
    useHasPermission(PERMISSIONS.FAMILLES_CREATE)
  const affectationsQuery = usePersonneFamilles(user?.personne.idPersonne)

  if (!canView && affectationsQuery.isLoading) {
    return <p className="text-sm text-slate-500">Vérification de l'accès…</p>
  }

  const leadsThisFamily = (affectationsQuery.data ?? []).some(
    (affectation) =>
      affectation.idFamille === familleId &&
      affectation.actif &&
      canAccessFamilleUnit(affectation.fonction),
  )

  if (!canView && !leadsThisFamily) return <ForbiddenPage />

  return <Outlet />
}
