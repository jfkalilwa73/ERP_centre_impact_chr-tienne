import type { TauxPresence } from '@/features/departements/presence'
import type { PresenceReunion } from './types'

export function tauxDepuisPresences(presences: PresenceReunion[]): TauxPresence[] {
  const parPersonne = new Map<string, { nom: string; presents: number; convocations: number }>()
  for (const ligne of presences) {
    const id = ligne.idPersonne || ligne.idAffectation
    const courant = parPersonne.get(id) ?? {
      nom: `${ligne.prenom ?? ''} ${ligne.nom ?? ''}`.trim() || 'Membre',
      presents: 0,
      convocations: 0,
    }
    courant.convocations += 1
    if (ligne.present) courant.presents += 1
    parPersonne.set(id, courant)
  }

  return [...parPersonne.entries()]
    .map(([idPersonne, item]) => ({
      idPersonne,
      nom: item.nom,
      presents: item.presents,
      convocations: item.convocations,
      taux: item.convocations ? Math.round((item.presents / item.convocations) * 100) : 0,
    }))
    .sort((left, right) => left.nom.localeCompare(right.nom, 'fr'))
}
