import { describe, expect, it } from 'vitest'
import type { Personne } from '@/types'
import { countDuplicateProfiles, findDuplicateGroups, isThisMonth, matchesPersonneSearch } from './duplicates'

function personne(partial: Partial<Personne> & Pick<Personne, 'idPersonne' | 'nom' | 'prenom'>): Personne {
  return {
    statut: 'actif',
    dateCreation: '2026-09-01T08:00:00Z',
    dateModification: '2026-09-01T08:00:00Z',
    ...partial,
  }
}

describe('détection de doublons', () => {
  it('regroupe les homonymes et fusionne avec un même téléphone', () => {
    const groupes = findDuplicateGroups([
      personne({
        idPersonne: '1',
        nom: 'MWAMBA',
        prenom: 'Pierre',
        telephone: '+243810000070',
      }),
      personne({
        idPersonne: '2',
        nom: 'Mwamba',
        prenom: 'Pierre',
        telephone: '+243810000071',
      }),
      personne({
        idPersonne: '3',
        nom: 'MWAMBA',
        prenom: 'Patrick',
        telephone: '+243 810 000 070',
      }),
      personne({ idPersonne: '4', nom: 'KABILA', prenom: 'Jean', telephone: '+243810000000' }),
    ])

    expect(groupes).toHaveLength(1)
    expect(countDuplicateProfiles(groupes)).toBe(3)
    expect(groupes[0]?.reasons).toEqual(expect.arrayContaining(['nom', 'telephone']))
  })

  it('ignore un numéro trop court et un profil unique', () => {
    const groupes = findDuplicateGroups([
      personne({ idPersonne: '1', nom: 'NGOY', prenom: 'Ruth', telephone: '123' }),
      personne({ idPersonne: '2', nom: 'KALONJI', prenom: 'Paul' }),
    ])

    expect(groupes).toHaveLength(0)
  })
})

describe('recherche de personnes', () => {
  it('retrouve un profil par nom ou téléphone', () => {
    const pierre = personne({
      idPersonne: '1',
      nom: 'MWAMBA',
      prenom: 'Pierre',
      telephone: '+243810000070',
    })

    expect(matchesPersonneSearch(pierre, 'mwamba')).toBe(true)
    expect(matchesPersonneSearch(pierre, '810000070')).toBe(true)
    expect(matchesPersonneSearch(pierre, 'kabila')).toBe(false)
  })
})

describe('inscriptions du mois', () => {
  it('reconnaît une date du mois courant', () => {
    expect(isThisMonth('2026-09-15T08:00:00Z', new Date('2026-09-19T10:00:00Z'))).toBe(true)
    expect(isThisMonth('2026-04-08T08:00:00Z', new Date('2026-09-19T10:00:00Z'))).toBe(false)
  })
})
