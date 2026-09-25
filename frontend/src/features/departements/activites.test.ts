import { describe, expect, it } from 'vitest'
import { notifyMembresActivite } from './activiteNotifications'
import {
  addActivite,
  formatJours,
  messageRappel,
  resetActivites,
  resumeActivite,
} from './activites'
import { listCirculations, resetCirculations, visibleCirculations } from '@/features/notifications/circulation'

describe('activités constantes', () => {
  it('résume les jours, l’heure et la modalité', () => {
    expect(formatJours([2, 6])).toBe('chaque mardi et samedi')
    expect(
      resumeActivite({
        date: '2026-09-22',
        recurrence: 'constante',
        jours: [2, 6],
        heure: '18:00',
        modalite: 'presentiel',
      }),
    ).toBe('chaque mardi et samedi · à 18 h · présentiel')
    expect(
      messageRappel({
        id: '1',
        titre: 'Répétition',
        date: '2026-09-22',
        description: 'Présence de toute l’équipe musicale.',
        statut: 'planifiee',
        recurrence: 'constante',
        jours: [2, 6],
        heure: '18:00',
        modalite: 'presentiel',
      }),
    ).toBe(
      'Répétition commence chaque mardi et samedi · à 18 h · présentiel. Présence de toute l’équipe musicale.',
    )
  })

  it('enregistre une activité constante et prévient les membres', () => {
    resetActivites()
    resetCirculations()
    const created = addActivite('d4f6b8c0-0006-4000-8000-000000000002', {
      titre: 'Service des bénévoles',
      date: '2026-09-27',
      description: 'Régie son du dimanche.',
      concerne: 'benevoles',
      recurrence: 'constante',
      jours: [0],
      heure: '08:30',
      modalite: 'presentiel',
    })

    notifyMembresActivite({
      activite: created,
      departementId: 'd4f6b8c0-0006-4000-8000-000000000002',
      nomDepartement: 'Département Louange',
      membreIds: ['chef', 'choriste'],
      auteur: { idPersonne: 'chef', nom: 'Pierre MWAMBA' },
    })

    const visible = visibleCirculations({
      idPersonne: 'choriste',
      isAdmin: false,
      isPasteur: false,
      superviseurDepartementIds: [],
      chefDepartementIds: [],
    })
    expect(visible).toHaveLength(1)
    expect(visible[0]?.kind).toBe('rappel')
    expect(visible[0]?.description).toContain('chaque dimanche · à 8 h 30 · présentiel')
    expect(listCirculations()[0]?.idPersonnesNotifiees).toEqual(['choriste'])
  })
})
