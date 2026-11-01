import { describe, expect, it } from 'vitest'
import {
  contributionsMensuelles,
  effectifUnite,
  entreesUniteCeMois,
  estDime,
  estOffrande,
  indicationMois,
  inscriptionsCeMois,
  nombreResponsables,
  croissanceEglise,
  progressionCultes,
  repartitionMembres,
  repartitionZones,
  sommeMotifs,
} from './indicateurs'

describe('indicateurs de l’accueil', () => {
  it('mesure la préparation des cultes déjà cochée', () => {
    const progression = progressionCultes(
      [{ id: 'louange', nom: 'Louange' }],
      [
        { id: '1', idDepartement: 'louange', titre: 'Culte du 14 juin', statut: 'faite' },
        { id: '2', idDepartement: 'louange', titre: 'Préparation du culte', statut: 'planifiee' },
        { id: '3', idDepartement: 'louange', titre: 'Répétition', statut: 'faite' },
      ],
    )

    expect(progression.faits).toBe(1)
    expect(progression.total).toBe(2)
    expect(progression.valeur).toBe(50)
  })

  it('reste à zéro tant qu’aucun point de culte n’est demandé', () => {
    const progression = progressionCultes([{ id: 'accueil', nom: 'Accueil' }], [])
    expect(progression.valeur).toBe(0)
    expect(progression.lignes).toEqual([])
  })

  it('range les contributions dans les six derniers mois', () => {
    const serie = contributionsMensuelles(
      [
        { montant: 200, date: '2026-08-01' },
        { montant: 80, date: '2026-08-20' },
        { montant: 50, date: '2025-01-01' },
      ],
      new Date(2026, 9, 18),
    )

    expect(serie).toHaveLength(6)
    expect(serie.find((item) => item.mois.startsWith('août'))?.montant).toBe(280)
    expect(serie.find((item) => item.mois.startsWith('oct'))?.montant).toBe(0)
  })

  it('sépare les offrandes et les dîmes selon le motif', () => {
    const rentrees = [
      { motif: 'Offrande du culte', montant: 200 },
      { motif: 'Dîme de mars', montant: 50 },
      { motif: 'Cotisations de cellule', montant: 80 },
    ]

    expect(estOffrande('Offrande du culte')).toBe(true)
    expect(estDime('Dîme de mars')).toBe(true)
    expect(sommeMotifs(rentrees, estOffrande)).toBe(200)
    expect(sommeMotifs(rentrees, estDime)).toBe(50)
  })

  it('indique le mouvement du mois', () => {
    expect(indicationMois(3)).toBe('+3 ce mois')
    expect(indicationMois(0)).toBe('+0 ce mois')
    expect(
      inscriptionsCeMois(
        [{ dateCreation: '2026-10-02T08:00:00Z' }, { dateCreation: '2026-08-01T08:00:00Z' }],
        new Date(2026, 9, 20),
      ),
    ).toBe(1)
    expect(
      entreesUniteCeMois(
        [
          { idUnite: 'louange', idPersonne: 'a', dateDebut: '2026-10-04' },
          { idUnite: 'louange', idPersonne: 'b', dateDebut: '2026-01-01' },
        ],
        'louange',
        new Date(2026, 9, 20),
      ),
    ).toBe(1)
  })

  it('compte les responsables et les personnes d’une unité', () => {
    const affectations = [
      { idPersonne: 'a', idUnite: 'louange', fonction: 'Chef', actif: true },
      { idPersonne: 'b', idUnite: 'louange', fonction: 'Accueillante', actif: true },
      { idPersonne: 'a', idUnite: 'batisseurs', fonction: 'Responsable', actif: true },
      { idPersonne: 'c', idUnite: 'louange', fonction: 'Superviseur', actif: false },
    ]

    expect(nombreResponsables(affectations)).toBe(1)
    expect(effectifUnite(affectations, 'louange')).toBe(2)
  })

  it('répartit les membres entre hommes, femmes et enfants', () => {
    const parts = repartitionMembres(
      [
        { sexe: 'M', dateNaissance: '1990-01-01' },
        { sexe: 'F', dateNaissance: '1992-05-01' },
        { sexe: 'M', dateNaissance: '2010-10-21' },
        { sexe: 'F', dateNaissance: '2008-10-20' },
        { sexe: 'M', statut: 'archive', dateNaissance: '1980-01-01' },
      ],
      new Date(2026, 9, 20),
    )

    expect(parts).toEqual([
      { nom: 'Hommes', total: 1 },
      { nom: 'Femmes', total: 2 },
      { nom: 'Enfants', total: 1 },
    ])
  })

  it('mesure l’effectif cumulé de l’église', () => {
    const serie = croissanceEglise(
      [
        { dateCreation: '2026-08-01', statut: 'actif' },
        { dateCreation: '2026-10-02', statut: 'actif' },
        { dateCreation: '2026-01-01', statut: 'archive' },
      ],
      new Date(2026, 9, 20),
      3,
    )

    expect(serie.map((item) => item.effectif)).toEqual([1, 1, 2])
  })

  it('regroupe les familles par zone', () => {
    expect(
      repartitionZones([{ zone: 'Nord' }, { zone: 'Nord' }, { zone: '  ' }, { zone: null }]),
    ).toEqual([
      { zone: 'Nord', total: 2 },
      { zone: 'Sans zone', total: 2 },
    ])
  })
})
