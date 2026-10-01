import { useEffect, useSyncExternalStore } from 'react'
import { getActivitesVersion, subscribeActivites } from '@/features/departements/activites'
import { getBudgetVersion, subscribeBudget } from '@/features/departements/budget'
import { syncAlertes } from './alertes'
import {
  getCirculationsVersion,
  subscribeCirculations,
  unreadCirculationsCount,
  visibleCirculations,
} from './circulation'
import { useInboxScope } from './inbox'
import { getDemandesVersion, subscribeDemandes, unreadDemandesCount } from './store'

export function useSyncAlertes() {
  const activitesVersion = useSyncExternalStore(subscribeActivites, getActivitesVersion, getActivitesVersion)
  const budgetVersion = useSyncExternalStore(subscribeBudget, getBudgetVersion, getBudgetVersion)
  useEffect(() => {
    syncAlertes()
  }, [activitesVersion, budgetVersion])
}

export function useUnreadDemandes() {
  const { user, isAdmin, isPasteur, isDge, chefDepartementIds, superviseurDepartementIds } = useInboxScope()
  useSyncAlertes()
  useSyncExternalStore(subscribeDemandes, getDemandesVersion, getDemandesVersion)
  useSyncExternalStore(subscribeCirculations, getCirculationsVersion, getCirculationsVersion)

  const demandes = unreadDemandesCount({ isAdmin, idPersonne: user?.personne.idPersonne })
  if (!user) return demandes

  const circulations = visibleCirculations({
    idPersonne: user.personne.idPersonne,
    isAdmin,
    isPasteur,
    isDge,
    superviseurDepartementIds,
    chefDepartementIds,
  })
  return demandes + unreadCirculationsCount(user.personne.idPersonne, circulations)
}
