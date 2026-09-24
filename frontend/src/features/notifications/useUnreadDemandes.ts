import { useSyncExternalStore } from 'react'
import {
  getCirculationsVersion,
  subscribeCirculations,
  unreadCirculationsCount,
  visibleCirculations,
} from './circulation'
import { useInboxScope } from './inbox'
import { getDemandesVersion, subscribeDemandes, unreadDemandesCount } from './store'

export function useUnreadDemandes() {
  const { user, isAdmin, isPasteur, chefDepartementIds, superviseurDepartementIds } = useInboxScope()
  useSyncExternalStore(subscribeDemandes, getDemandesVersion, getDemandesVersion)
  useSyncExternalStore(subscribeCirculations, getCirculationsVersion, getCirculationsVersion)

  const demandes = unreadDemandesCount({ isAdmin, idPersonne: user?.personne.idPersonne })
  if (!user) return demandes

  const circulations = visibleCirculations({
    idPersonne: user.personne.idPersonne,
    isAdmin,
    isPasteur,
    superviseurDepartementIds,
    chefDepartementIds,
  })
  return demandes + unreadCirculationsCount(user.personne.idPersonne, circulations)
}
