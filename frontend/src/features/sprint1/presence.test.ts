import { describe, expect, it } from 'vitest'
import { tauxDepuisPresences } from './presence'
import { LIEN_VERS_RELATION } from './types'

describe('suivi sprint 1', () => {
  it('calcule le taux à partir des feuilles de réunion', () => {
    const taux = tauxDepuisPresences([
      { idPresence: '1', idAffectation: 'a', idPersonne: 'p', nom: 'KABILA', prenom: 'Jean', dateReunion: '2026-10-01', present: true },
      { idPresence: '2', idAffectation: 'a', idPersonne: 'p', nom: 'KABILA', prenom: 'Jean', dateReunion: '2026-10-08', present: false },
    ])
    expect(taux).toEqual([
      { idPersonne: 'p', nom: 'Jean KABILA', presents: 1, convocations: 2, taux: 50 },
    ])
  })

  it('reprend les liens déjà saisis sur la fiche', () => {
    expect(LIEN_VERS_RELATION.Conjoint).toBe('conjoint')
    expect(LIEN_VERS_RELATION['Frère']).toBe('frere_soeur')
    expect(LIEN_VERS_RELATION['Sœur']).toBe('frere_soeur')
  })
})