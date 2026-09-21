import { describe, expect, it } from 'vitest'
import type { Personne } from '@/types'
import { assignFamilleToPersonne } from './familles'
import { complementFromEdit, criteresFiche, emptyFicheComplement } from './fiche'
import { emptyPersonneEditForm } from './schema'

const personne: Personne = {
  idPersonne: 'b2d4f6a8-0004-4000-8000-000000000099',
  nom: 'TEST',
  prenom: 'Fiche',
  dateNaissance: '1990-01-01',
  sexe: 'F',
  telephone: '+243810000099',
  adresse: 'Kinshasa',
  statut: 'actif',
  dateCreation: '2026-01-01T00:00:00.000Z',
  dateModification: '2026-01-01T00:00:00.000Z',
}

describe('qualité de la fiche', () => {
  it('exclut le contact d’urgence et reste incomplète tant que les infos manquent', () => {
    const qualite = criteresFiche({ personne, complement: emptyFicheComplement })
    expect(qualite.completude).toBeLessThan(100)
    expect(qualite.manquants.map((item) => item.id)).not.toContain('urgence')
    expect(qualite.manquants.map((item) => item.id)).toEqual(
      expect.arrayContaining(['statutCivil', 'bapteme', 'formation001', 'famille', 'liens']),
    )
  })

  it('atteint 100 % lorsque tous les critères sont fournis', () => {
    assignFamilleToPersonne(personne.idPersonne, 'f1a2b3c4-0008-4000-8000-000000000001')
    const qualite = criteresFiche({
      personne,
      complement: {
        statutCivil: 'marie',
        competences: 'Accueil',
        liens: [
          {
            idPersonne: 'b2d4f6a8-0004-4000-8000-000000000001',
            lien: 'Conjoint',
            dateAjout: '2026-04-01T00:00:00.000Z',
          },
        ],
        certificatBaptemeNom: 'bapteme.pdf',
        formations: { '001': true, '101': true, '201': true },
        notes: [],
      },
    })
    expect(qualite.completude).toBe(100)
    expect(qualite.manquants).toEqual([])
  })

  it('convertit le formulaire de modification en complément de fiche', () => {
    const complement = complementFromEdit({
      ...emptyPersonneEditForm,
      statutCivil: 'celibataire',
      competences: '  Louange  ',
      liens: [
        { idPersonne: '', lien: 'Frère' },
        { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000001', lien: 'Sœur' },
      ],
      certificatBaptemeNom: 'certificat.pdf',
      formation001: true,
      formation101: false,
      formation201: true,
    })

    expect(complement.competences).toBe('Louange')
    expect(complement.liens).toEqual([
      expect.objectContaining({
        idPersonne: 'b2d4f6a8-0004-4000-8000-000000000001',
        lien: 'Sœur',
      }),
    ])
    expect(complement.formations).toEqual({ '001': true, '101': false, '201': true })
  })
})
