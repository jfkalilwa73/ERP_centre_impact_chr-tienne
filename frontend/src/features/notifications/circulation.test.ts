import { describe, expect, it } from 'vitest'
import {
  canReplyCirculation,
  createCirculation,
  repondreCirculation,
  resetCirculations,
  unreadCirculationsCount,
  visibleCirculations,
} from './circulation'

const payload = {
  kind: 'rapport' as const,
  titre: 'Bilan répétition',
  description: 'Choeur complet.',
  idDepartementSource: 'louange',
  nomDepartementSource: 'Louange',
  idDepartementCible: 'accueil',
  nomDepartementCible: 'Accueil',
  idAuteur: 'chef-louange',
  nomAuteur: 'Pierre MWAMBA',
}

describe('circulation des messages de département', () => {
  it('est visible du superviseur, du pasteur et de l’admin, mais seul le destinataire répond', () => {
    resetCirculations()
    const created = createCirculation(payload)

    const visibleAdmin = visibleCirculations({
      isAdmin: true,
      isPasteur: false,
      superviseurDepartementIds: [],
      chefDepartementIds: [],
    })
    const visiblePasteur = visibleCirculations({
      isAdmin: false,
      isPasteur: true,
      superviseurDepartementIds: [],
      chefDepartementIds: [],
    })
    const visibleSuperviseur = visibleCirculations({
      isAdmin: false,
      isPasteur: false,
      superviseurDepartementIds: ['louange'],
      chefDepartementIds: [],
    })

    expect(visibleAdmin.map((item) => item.id)).toContain(created.id)
    expect(visiblePasteur.map((item) => item.id)).toContain(created.id)
    expect(visibleSuperviseur.map((item) => item.id)).toContain(created.id)
    expect(canReplyCirculation(created, [])).toBe(false)
    expect(canReplyCirculation(created, ['louange'])).toBe(false)
    expect(canReplyCirculation(created, ['accueil'])).toBe(true)

    repondreCirculation(created.id, { texte: 'Vu', idAuteur: 'sup', nomAuteur: 'Daniel' }, [])
    expect(created.reponses).toHaveLength(0)

    repondreCirculation(
      created.id,
      { texte: 'Reçu, on prépare l’accueil.', idAuteur: 'chef-accueil', nomAuteur: 'Jean' },
      ['accueil'],
    )
    expect(created.reponses).toHaveLength(1)
    expect(unreadCirculationsCount('admin', visibleAdmin)).toBe(1)
    expect(unreadCirculationsCount('chef-louange', [created])).toBe(0)
  })
})
