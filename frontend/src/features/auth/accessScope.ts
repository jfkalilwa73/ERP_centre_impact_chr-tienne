import { useMemo } from 'react'
import {
  canAccessDepartementUnit,
  isLeadershipRole,
  isSupervisionRole,
} from '@/features/departements/roles'
import { isLeadershipRole as isFamilleLeadership } from '@/features/familles/roles'
import { usePersonneAffectations, usePersonneFamilles } from '@/features/personnes/hooks'
import { hasWideAccess } from '@/lib/permissions'
import { useCurrentUser } from '@/stores/authStore'

/** Périmètre d'un chef ou d'un superviseur : uniquement les unités affectées.
 * Un pasteur ou un DGE a `membres.read` : il n'est pas enfermé dans une unité. */
export function useAccessScope() {
  const user = useCurrentUser()
  const permissions = user?.permissions ?? []
  const wide = hasWideAccess(permissions)
  const departementsQuery = usePersonneAffectations(user?.personne.idPersonne)
  const famillesQuery = usePersonneFamilles(user?.personne.idPersonne)

  const ledDepartementIds = useMemo(
    () =>
      (departementsQuery.data ?? [])
        .filter((affectation) => affectation.actif && canAccessDepartementUnit(affectation.fonction))
        .map((affectation) => affectation.idDepartement),
    [departementsQuery.data],
  )
  const chefDepartementIds = useMemo(
    () =>
      (departementsQuery.data ?? [])
        .filter((affectation) => affectation.actif && isLeadershipRole(affectation.fonction))
        .map((affectation) => affectation.idDepartement),
    [departementsQuery.data],
  )
  const superviseurDepartementIds = useMemo(
    () =>
      (departementsQuery.data ?? [])
        .filter((affectation) => affectation.actif && isSupervisionRole(affectation.fonction))
        .map((affectation) => affectation.idDepartement),
    [departementsQuery.data],
  )
  const ledFamilleIds = useMemo(
    () =>
      (famillesQuery.data ?? [])
        .filter((affectation) => affectation.actif && isFamilleLeadership(affectation.fonction))
        .map((affectation) => affectation.idFamille),
    [famillesQuery.data],
  )

  const isSuperviseur = superviseurDepartementIds.length > 0
  const isScoped = Boolean(user) && !wide
  const homePath = isSuperviseur
    ? '/departements'
    : chefDepartementIds[0]
      ? `/departements/${chefDepartementIds[0]}`
      : ledDepartementIds[0]
        ? `/departements/${ledDepartementIds[0]}`
        : ledFamilleIds[0]
          ? `/familles/${ledFamilleIds[0]}`
          : '/'

  return {
    isScoped,
    isSuperviseur,
    isLoading: Boolean(user) && (departementsQuery.isLoading || famillesQuery.isLoading),
    homePath,
    ledDepartementIds,
    chefDepartementIds,
    superviseurDepartementIds,
    ledFamilleIds,
  }
}
