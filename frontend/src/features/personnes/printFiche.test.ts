import { describe, expect, it } from 'vitest'
import { seedPersonnes } from '@/mocks/fixtures'
import { emptyFicheComplement } from './fiche'
import { formatDateLong } from './labels'
import { buildFichePdfHtml } from './printFiche'

describe('export PDF de la fiche', () => {
  it('n’inclut que le nom, la photo, les coordonnées, le civil, les liens et les ministères', () => {
    const jean = seedPersonnes[0]!
    const html = buildFichePdfHtml({
      personne: jean,
      photoSrc: 'data:image/png;base64,abc',
      email: 'admin@eglise.org',
      sexeLabel: 'Homme',
      famille: 'Bâtisseurs (Nord)',
      complement: {
        ...emptyFicheComplement,
        statutCivil: 'marie',
        competences: 'Accueil',
        liens: [{ idPersonne: seedPersonnes[1]!.idPersonne, lien: 'Conjoint', dateAjout: '2026-09-21T00:00:00Z' }],
      },
      personnes: seedPersonnes,
      affectationsActives: [
        {
          idPersonne: jean.idPersonne,
          idDepartement: 'dep-accueil',
          dateDebut: '2026-01-12',
          actif: true,
          fonction: 'Responsable accueil',
        },
      ],
      nomDepartement: () => 'Département Accueil (ACCUEIL)',
      formatDateLong,
    })

    expect(html).toContain('Jean KABILA')
    expect(html).toContain('logo-icc.png')
    expect(html).toContain('Impact Centre Chrétien')
    expect(html).toContain('data:image/png;base64,abc')
    expect(html).toContain('Coordonnées')
    expect(html).toContain('+243810000000')
    expect(html).toContain('Détails Civils')
    expect(html).toContain('Liens Familiaux')
    expect(html).toContain('Grâce MUKENDI — Conjoint')
    expect(html).toContain('Responsabilités')
    expect(html).toContain('Responsable accueil')
    expect(html).not.toContain('Qualité de la fiche')
    expect(html).not.toContain('Notes Pastorales')
    expect(html).not.toContain('Historique')
    expect(html).not.toContain('MEM-2026')
  })
})
