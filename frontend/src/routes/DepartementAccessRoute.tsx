import { Outlet, useParams } from 'react-router-dom'
import { ChargementCentre } from '@/components/ui/Chargement'
import { canSeeAllUnits } from '@/features/auth/orgRoles'
import { canAccessDepartementUnit } from '@/features/departements/roles'
import { usePersonneAffectations } from '@/features/personnes/hooks'
import { PERMISSIONS } from '@/lib/permissions'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { useCurrentUser, useHasPermission } from '@/stores/authStore'

/** Interface d'un département : DGE / admin / pasteur, ou chef / adjoint / superviseur de l'unité. */
export function DepartementAccessRoute() {
  const { departementId } = useParams<{ departementId: string }>()
  const user = useCurrentUser()
  const canViewWide =
    canSeeAllUnits(user) ||
    useHasPermission(PERMISSIONS.DEPARTEMENTS_UPDATE) ||
    useHasPermission(PERMISSIONS.DEPARTEMENTS_CREATE)
  const affectationsQuery = usePersonneAffectations(user?.personne.idPersonne)

  if (!canViewWide && affectationsQuery.isLoading) {
    return <ChargementCentre label="Vérification de l'accès…" page />
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
