import { useMemo } from 'react'
import {
  getUnitApplicationPageRule,
  hasUnitApplicationPageRuleForPerson,
  useUnitPageRulesSnapshot,
  type ApplicationPageId,
} from './unitPageAccess'
import { usePersonneAffectations, usePersonneFamilles } from '@/features/personnes/hooks'
import { useCurrentUser } from '@/stores/authStore'

function matchesPath(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`)
}

export function applicationPageFromPath(pathname: string): ApplicationPageId | null {
  const path = pathname.replace(/\/+$/, '') || '/'

  if (path === '/') return 'accueil'
  if (matchesPath(path, '/notifications')) return 'notifications'
  if (matchesPath(path, '/personnes')) return 'personnes'
  if (path === '/departements/suivi') return 'departements-suivi'
  if (path === '/departements/rapports') return 'departements-rapports'
  if (path === '/departements') return 'departements'
  if (path.startsWith('/departements/')) return null
  if (path === '/familles/suivi') return 'familles-suivi'
  if (path === '/familles/rapports') return 'familles-rapports'
  if (path === '/familles') return 'familles'
  if (path.startsWith('/familles/')) return null
  if (matchesPath(path, '/comptes')) return 'comptes'
  if (matchesPath(path, '/sites')) return 'sites'
  if (matchesPath(path, '/roles')) return 'roles'
  if (matchesPath(path, '/permissions')) return 'permissions'
  if (matchesPath(path, '/audit')) return 'audit'
  return null
}

/**
 * Combines the application-page grants saved for each active department or family.
 * A global page is available when at least one active unit rule grants it.
 */
export function useApplicationPageAccess() {
  const user = useCurrentUser()
  const personneId = user?.personne.idPersonne
  const departementsQuery = usePersonneAffectations(personneId)
  const famillesQuery = usePersonneFamilles(personneId)
  const snapshot = useUnitPageRulesSnapshot()

  const unitRules = useMemo(() => {
    if (!personneId) return []

    const departmentRules = (departementsQuery.data ?? [])
      .filter((affectation) => affectation.actif)
      .map((affectation) =>
        getUnitApplicationPageRule('departement', affectation.idDepartement, personneId, snapshot),
      )
    const familyRules = (famillesQuery.data ?? [])
      .filter((affectation) => affectation.actif)
      .map((affectation) =>
        getUnitApplicationPageRule('famille', affectation.idFamille, personneId, snapshot),
      )

    return [...departmentRules, ...familyRules].filter(
      (rule): rule is ApplicationPageId[] => rule !== null,
    )
  }, [departementsQuery.data, famillesQuery.data, personneId, snapshot])

  const needsUnitRules = Boolean(personneId) && hasUnitApplicationPageRuleForPerson(personneId!, snapshot)
  const isLoading = needsUnitRules && (departementsQuery.isLoading || famillesQuery.isLoading)

  return {
    isLoading,
    hasConfiguredRules: unitRules.length > 0,
    canView(page: ApplicationPageId, roleAllows = true) {
      if (!roleAllows) return false
      if (isLoading || unitRules.length === 0) return roleAllows
      return unitRules.some((rule) => rule.includes(page))
    },
  }
}
