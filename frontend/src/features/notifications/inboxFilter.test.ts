import { describe, expect, it } from 'vitest'
import type { Circulation } from './circulation'
import { filterCirculations, filterDemandes } from './inboxFilter'
import type { DemandeSuperviseur } from './store'

const circulation = (overrides: Partial<Circulation> = {}): Circulation => ({
  id: '1',
  kind: 'rapport',
  titre: 'Bilan répétition',
  description: 'Choeur complet.',
  idDepartementSource: 'louange',
  nomDepartementSource: 'Département Louange',
  idDepartementCible: 'accueil',
  nomDepartementCible: 'Département Accueil',
  idAuteur: 'chef',
  nomAuteur: 'Pierre MWAMBA',
  dateCreation: '2026-09-25T00:00:00.000Z',
  reponses: [],
  luPar: [],
  ...overrides,
})

const demande = (overrides: Partial<DemandeSuperviseur> = {}): DemandeSuperviseur => ({
  id: 'd1',
  idPersonneCible: 'p',
  nomCible: 'Patrick MWAMBA',
  idDepartement: 'diaconie',
  nomDepartement: 'Département Diaconie',
  idDemandeur: 'dge',
  nomDemandeur: 'Esther LUMBU',
  roleCible: 'Superviseur',
  statut: 'en_attente',
  dateCreation: '2026-09-25T00:00:00.000Z',
  luAdmin: false,
  luDemandeur: false,
  ...overrides,
})

describe('filtres de la boîte de notifications', () => {
  it('retrouve un message par titre, type ou département', () => {
    const items = [
      circulation(),
      circulation({
        id: '2',
        kind: 'alerte',
        titre: 'Présence faible : Daniel KASONGO',
        idDepartementCible: 'louange',
        nomDepartementCible: 'Département Louange',
      }),
    ]

    expect(filterCirculations(items, { q: 'présence', kind: '', departement: '' }).map((item) => item.id)).toEqual([
      '2',
    ])
    expect(filterCirculations(items, { q: '', kind: 'rapport', departement: '' }).map((item) => item.id)).toEqual([
      '1',
    ])
    expect(
      filterCirculations(items, { q: '', kind: '', departement: 'Département Accueil' }).map((item) => item.id),
    ).toEqual(['1'])
  })

  it('isole les ouvertures de comptes des autres messages', () => {
    const items = [demande()]
    expect(filterDemandes(items, { q: 'patrick', kind: '', departement: '' })).toHaveLength(1)
    expect(filterDemandes(items, { q: '', kind: 'ouverture', departement: '' })).toHaveLength(1)
    expect(filterDemandes(items, { q: '', kind: 'rapport', departement: '' })).toHaveLength(0)
    expect(filterCirculations([circulation()], { q: '', kind: 'ouverture', departement: '' })).toHaveLength(0)
  })
})
