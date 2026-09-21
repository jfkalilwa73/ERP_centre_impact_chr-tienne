import { describe, expect, it } from 'vitest'
import { seedDepartements, seedPersonnes } from '@/mocks/fixtures'
import { useAuthStore } from '@/stores/authStore'
import {
  assignPersonneDepartement,
  createPersonne,
  deletePersonne,
  listPersonneDepartements,
  listPersonnes,
  unassignPersonneDepartement,
  updatePersonne,
} from './api'

async function ouvrirSession(email = 'admin@eglise.org', motDePasse = 'SecurePass123!') {
  const { login } = await import('@/features/auth/api')
  const response = await login({ email, motDePasse })
  useAuthStore.getState().openSession(response)
  return response
}

describe('API personnes', () => {
  it('liste les personnes paginées', async () => {
    await ouvrirSession()

    const page = await listPersonnes({ page: 1, limit: 20 })

    expect(page.pagination.total).toBe(seedPersonnes.length)
    expect(page.data.map((personne) => personne.nom)).toContain('KABILA')
  })

  it('filtre par statut', async () => {
    await ouvrirSession()

    const page = await listPersonnes({ statut: 'inactif' })

    expect(page.data).toHaveLength(1)
    expect(page.data[0]?.prenom).toBe('Marie')
  })

  it('crée une personne puis refuse un téléphone déjà pris', async () => {
    await ouvrirSession()

    const created = await createPersonne({
      nom: 'MBALA',
      prenom: 'Sarah',
      telephone: '+243810000050',
      statut: 'actif',
    })

    expect(created.prenom).toBe('Sarah')

    await expect(
      createPersonne({
        nom: 'DOUBLON',
        prenom: 'Test',
        telephone: '+243810000050',
        statut: 'actif',
      }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' })
  })

  it('modifie une personne existante', async () => {
    await ouvrirSession()
    const cible = (await listPersonnes()).data.find((personne) => personne.nom === 'KABILA')
    if (!cible) throw new Error('Jean Kabila absent')

    const updated = await updatePersonne(cible.idPersonne, { adresse: 'Gombe' })

    expect(updated.adresse).toBe('Gombe')
  })

  it("refuse la suppression d'une personne active", async () => {
    await ouvrirSession()
    const active = (await listPersonnes()).data.find((personne) => personne.statut === 'actif')
    if (!active) throw new Error('personne active absente')

    await expect(deletePersonne(active.idPersonne)).rejects.toMatchObject({ status: 409 })
  })

  it("supprime une personne inactive", async () => {
    await ouvrirSession()
    const inactive = (await listPersonnes({ statut: 'inactif' })).data[0]
    if (!inactive) throw new Error('personne inactive absente')

    await expect(deletePersonne(inactive.idPersonne)).resolves.toBeUndefined()
    const remaining = await listPersonnes()
    expect(remaining.data.some((personne) => personne.prenom === 'Marie')).toBe(false)
  })

  it('interdit la création sans le droit membres.create', async () => {
    await ouvrirSession('accueil@eglise.org', 'Accueil2026!')

    await expect(
      createPersonne({ nom: 'TEST', prenom: 'Lecture', statut: 'actif' }),
    ).rejects.toMatchObject({ status: 403 })
  })
})

describe('API affectations départementales', () => {
  it("liste les affectations d'une personne", async () => {
    await ouvrirSession()
    const jean = seedPersonnes[0]
    if (!jean) throw new Error('Jean absent du jeu de démonstration')

    const affectations = await listPersonneDepartements(jean.idPersonne)

    expect(affectations.some((affectation) => affectation.actif)).toBe(true)
  })

  it('affecte puis refuse un doublon actif', async () => {
    await ouvrirSession()
    const paul = seedPersonnes.find((personne) => personne.prenom === 'Paul')
    const louange = seedDepartements.find((departement) => departement.code === 'LOUANGE')
    if (!paul || !louange) throw new Error('jeu de démonstration incomplet')

    const created = await assignPersonneDepartement(paul.idPersonne, {
      idDepartement: louange.idDepartement,
      fonction: 'Chef de louange',
    })
    expect(created.actif).toBe(true)

    await expect(
      assignPersonneDepartement(paul.idPersonne, { idDepartement: louange.idDepartement }),
    ).rejects.toMatchObject({ status: 409 })
  })

  it("clôture une affectation sans l'effacer", async () => {
    await ouvrirSession()
    const jean = seedPersonnes[0]
    const accueil = seedDepartements.find((departement) => departement.code === 'ACCUEIL')
    if (!jean || !accueil) throw new Error('jeu de démonstration incomplet')

    await unassignPersonneDepartement(jean.idPersonne, accueil.idDepartement)

    const affectations = await listPersonneDepartements(jean.idPersonne)
    const cloturee = affectations.find(
      (affectation) => affectation.idDepartement === accueil.idDepartement,
    )
    expect(cloturee?.actif).toBe(false)
    expect(cloturee?.dateFin).toBeTruthy()
  })
})
