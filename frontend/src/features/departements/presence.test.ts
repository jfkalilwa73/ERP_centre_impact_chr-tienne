import { describe, expect, it } from 'vitest'
import type { Activite } from './activites'
import { presenceFaible, tauxPresenceMembres } from './presence'

const activites: Activite[] = [
  {
    id: '1',
    titre: 'Répétition générale',
    date: '2026-05-03',
    description: '',
    statut: 'faite',
    compteRendu: {
      date: '2026-05-03',
      deroulement: 'Tenue.',
      presence: [
        { idPersonne: 'pierre', nom: 'Pierre MWAMBA', present: true },
        { idPersonne: 'daniel', nom: 'Daniel KASONGO', present: true },
      ],
    },
  },
  {
    id: '2',
    titre: 'Atelier vocal',
    date: '2026-06-20',
    description: '',
    statut: 'faite',
    compteRendu: {
      date: '2026-06-20',
      deroulement: 'Voix.',
      presence: [
        { idPersonne: 'pierre', nom: 'Pierre MWAMBA', present: true },
        { idPersonne: 'daniel', nom: 'Daniel KASONGO', present: false },
      ],
    },
  },
  {
    id: '3',
    titre: 'Culte',
    date: '2026-06-14',
    description: '',
    statut: 'faite',
    compteRendu: {
      date: '2026-06-14',
      deroulement: 'Culte.',
      presence: [
        { idPersonne: 'pierre', nom: 'Pierre MWAMBA', present: true },
        { idPersonne: 'daniel', nom: 'Daniel KASONGO', present: false },
      ],
    },
  },
]

describe('taux de présence', () => {
  it('calcule le taux à partir des comptes rendus et signale un membre trop absent', () => {
    const taux = tauxPresenceMembres(activites)
    const pierre = taux.find((item) => item.idPersonne === 'pierre')
    const daniel = taux.find((item) => item.idPersonne === 'daniel')

    expect(pierre).toMatchObject({ presents: 3, convocations: 3, taux: 100 })
    expect(daniel).toMatchObject({ presents: 1, convocations: 3, taux: 33 })
    expect(presenceFaible(pierre!)).toBe(false)
    expect(presenceFaible(daniel!)).toBe(true)
  })

  it('n’alerte pas sur une seule activité', () => {
    expect(
      presenceFaible({
        idPersonne: '1',
        nom: 'Solo',
        presents: 0,
        convocations: 1,
        taux: 0,
      }),
    ).toBe(false)
  })
})
