import { describe, expect, it } from 'vitest'
import {
  createDemandeCompte,
  createDemandeSuperviseur,
  deleteDemande,
  findDemandeEnAttente,
  listDemandes,
  refuserDemandeSuperviseur,
  resetDemandes,
  traiterDemandeSuperviseur,
  unreadDemandesCount,
} from './store'

describe('demandes superviseur', () => {
  it('n’ouvre pas deux demandes identiques en attente', () => {
    resetDemandes()
    const payload = {
      idPersonneCible: 'p1',
      nomCible: 'Patrick MWAMBA',
      idDepartement: 'd1',
      nomDepartement: 'Louange',
      idDemandeur: 'chef',
      nomDemandeur: 'Pierre MWAMBA',
    }

    const first = createDemandeSuperviseur(payload)
    const second = createDemandeSuperviseur(payload)

    expect(first!.id).toBe(second!.id)
    expect(listDemandes()).toHaveLength(1)
    expect(findDemandeEnAttente('p1', 'd1')?.statut).toBe('en_attente')
  })

  it('sépare une demande chef d’une demande superviseur', () => {
    resetDemandes()
    const base = {
      idPersonneCible: 'p1',
      nomCible: 'Patrick MWAMBA',
      idDepartement: 'd1',
      nomDepartement: 'Louange',
      idDemandeur: 'dge',
      nomDemandeur: 'Esther LUMBU',
    }

    createDemandeCompte({ ...base, roleCible: 'Superviseur' })
    createDemandeCompte({ ...base, roleCible: 'Chef' })

    expect(listDemandes()).toHaveLength(2)
    expect(findDemandeEnAttente('p1', 'd1', 'Chef')?.roleCible).toBe('Chef')
  })

  it('prévient le chef après traitement', () => {
    resetDemandes()
    const demande = createDemandeSuperviseur({
      idPersonneCible: 'p1',
      nomCible: 'Patrick MWAMBA',
      idDepartement: 'd1',
      nomDepartement: 'Louange',
      idDemandeur: 'chef',
      nomDemandeur: 'Pierre MWAMBA',
    })

    expect(unreadDemandesCount({ isAdmin: true })).toBe(1)
    traiterDemandeSuperviseur(demande!.id, 'patrick.mwamba@eglise.org')

    expect(listDemandes()[0]?.statut).toBe('traitee')
    expect(unreadDemandesCount({ isAdmin: true })).toBe(0)
    expect(unreadDemandesCount({ isAdmin: false, idPersonne: 'chef' })).toBe(1)
  })

  it('peut refuser une demande', () => {
    resetDemandes()
    const demande = createDemandeSuperviseur({
      idPersonneCible: 'p1',
      nomCible: 'Patrick MWAMBA',
      idDepartement: 'd1',
      nomDepartement: 'Louange',
      idDemandeur: 'chef',
      nomDemandeur: 'Pierre MWAMBA',
    })

    refuserDemandeSuperviseur(demande!.id)
    expect(listDemandes()[0]?.statut).toBe('refusee')
  })

  it('supprime une demande déjà traitée, pas une demande en attente', () => {
    resetDemandes()
    const demande = createDemandeSuperviseur({
      idPersonneCible: 'p1',
      nomCible: 'Patrick MWAMBA',
      idDepartement: 'd1',
      nomDepartement: 'Louange',
      idDemandeur: 'chef',
      nomDemandeur: 'Pierre MWAMBA',
    })

    deleteDemande(demande!.id)
    expect(listDemandes()).toHaveLength(1)

    traiterDemandeSuperviseur(demande!.id, 'patrick.mwamba@eglise.org')
    deleteDemande(demande!.id)
    expect(listDemandes()).toHaveLength(0)
  })
})
