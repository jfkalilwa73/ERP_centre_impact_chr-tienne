import { Outlet, useParams } from 'react-router-dom'
import { isLeadershipRole } from '@/features/departements/roles'
import { usePersonneAffectations } from '@/features/personnes/hooks'
import { PERMISSIONS } from '@/lib/permissions'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { useCurrentUser, useHasPermission } from '@/stores/authStore'

/** Interface d'un département : managers, ou chef / adjoint de ce département. */
export function DepartementAccessRoute() {
  const { departementId } = useParams<{ departementId: string }>()
  const canManage =
    useHasPermission(PERMISSIONS.DEPARTEMENTS_UPDATE) || useHasPermission(PERMISSIONS.DEPARTEMENTS_CREATE)
  const user = useCurrentUser()
  const affectationsQuery = usePersonneAffectations(user?.personne.idPersonne)

  if (!canManage && affectationsQuery.isLoading) {
    return <p className="text-sm text-slate-500">Vérification de l'accès…</p>
  }

  const leadsThisDepartment = (affectationsQuery.data ?? []).some(
    (affectation) =>
      affectation.idDepartement === departementId &&
      affectation.actif &&
      isLeadershipRole(affectation.fonction),
  )

  if (!canManage && !leadsThisDepartment) return <ForbiddenPage />

  return <Outlet />
}
