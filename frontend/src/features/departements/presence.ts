import type { Activite } from './activites'

export const SEUIL_PRESENCE_FAIBLE = 50
export const MIN_ACTIVITES_PRESENCE = 2

export type TauxPresence = {
  idPersonne: string
  nom: string
  presents: number
  convocations: number
  taux: number
}

export function tauxPresenceMembres(activites: Activite[]): TauxPresence[] {
  const byPerson = new Map<string, { nom: string; presents: number; convocations: number }>()
  activites
    .filter((activite) => activite.compteRendu?.presence.length)
    .forEach((activite) => {
      activite.compteRendu!.presence.forEach((ligne) => {
        const current = byPerson.get(ligne.idPersonne) ?? {
          nom: ligne.nom,
          presents: 0,
          convocations: 0,
        }
        current.convocations += 1
        if (ligne.present) current.presents += 1
        byPerson.set(ligne.idPersonne, current)
      })
    })

  return [...byPerson.entries()]
    .map(([idPersonne, item]) => ({
      idPersonne,
      nom: item.nom,
      presents: item.presents,
      convocations: item.convocations,
      taux: item.convocations ? Math.round((item.presents / item.convocations) * 100) : 0,
    }))
    .sort((left, right) => left.nom.localeCompare(right.nom, 'fr'))
}

export function presenceFaible(
  item: TauxPresence,
  seuil = SEUIL_PRESENCE_FAIBLE,
  minActivites = MIN_ACTIVITES_PRESENCE,
) {
  return item.convocations >= minActivites && item.taux < seuil
}
