import { Outlet } from 'react-router-dom'
import { ChargementCentre } from '@/components/ui/Chargement'
import { canSeeAllUnits } from '@/features/auth/orgRoles'
import { canAccessFamilleUnit } from '@/features/familles/roles'
import { usePersonneFamilles } from '@/features/personnes/hooks'
import { PERMISSIONS } from '@/lib/permissions'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { useCurrentUser } from '@/stores/authStore'

/** La liste des familles est réservée aux personnes qui pilotent au moins une famille, ou aux profils larges. */
export function FamilleListAccessRoute() {
  const user = useCurrentUser()
  const permissions = user?.permissions ?? []
  const canViewAllFamilies =
    canSeeAllUnits(user) ||
    permissions.includes(PERMISSIONS.FAMILLES_UPDATE) ||
    permissions.includes(PERMISSIONS.FAMILLES_CREATE)
  const affectationsQuery = usePersonneFamilles(user?.personne.idPersonne)

  if (!canViewAllFamilies && affectationsQuery.isLoading) {
    return <ChargementCentre label="Vérification de l’accès aux familles…" page />
  }

  const leadsFamily = (affectationsQuery.data ?? []).some(
    (affectation) => affectation.actif && canAccessFamilleUnit(affectation.fonction),
  )

  if (!canViewAllFamilies && !leadsFamily) return <ForbiddenPage />

  return <Outlet />
}
