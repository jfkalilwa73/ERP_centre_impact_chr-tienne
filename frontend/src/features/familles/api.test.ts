import { describe, expect, it } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import { createFamille, deleteFamille, listFamilles, updateFamille } from './api'

const identifiants = { email: 'admin@eglise.org', motDePasse: 'SecurePass123!' }

async function ouvrirSession(email = identifiants.email, motDePasse = identifiants.motDePasse) {
  const { login } = await import('@/features/auth/api')
  const response = await login({ email, motDePasse })
  useAuthStore.getState().openSession(response)
  return response
}

describe("API familles d'impact", () => {
  it('liste les familles paginées', async () => {
    await ouvrirSession()

    const page = await listFamilles({ page: 1, limit: 20 })

    expect(page.pagination.total).toBe(4)
    expect(page.data.map((famille) => famille.code)).toContain('BATISSEURS')
  })

  it('filtre par recherche', async () => {
    await ouvrirSession()

    const page = await listFamilles({ q: 'grâce' })

    expect(page.data).toHaveLength(1)
    expect(page.data[0]?.code).toBe('GRACE')
  })

  it('crée une famille puis refuse un code déjà pris', async () => {
    await ouvrirSession()

    const created = await createFamille({
      code: 'ESPERANCE',
      nom: 'Espérance',
      zone: 'Ouest',
      actif: true,
    })

    expect(created.code).toBe('ESPERANCE')
    expect(created.nom).toBe('Espérance')

    await expect(
      createFamille({
        code: 'esperance',
        nom: 'Doublon',
        actif: true,
      }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' })
  })

  it('modifie une famille existante', async () => {
    await ouvrirSession()
    const [famille] = (await listFamilles()).data
    if (!famille) throw new Error('aucune famille de démonstration')

    const updated = await updateFamille(famille.idFamille, {
      nom: 'Bâtisseurs renouvelés',
    })

    expect(updated.nom).toBe('Bâtisseurs renouvelés')
  })

  it("refuse la suppression d'une famille encore utilisée", async () => {
    await ouvrirSession()
    const occupee = (await listFamilles()).data.find((item) => item.code === 'BATISSEURS')
    if (!occupee) throw new Error('famille Bâtisseurs absente')

    await expect(deleteFamille(occupee.idFamille)).rejects.toMatchObject({ status: 409 })
  })

  it("supprime une famille inutilisée", async () => {
    await ouvrirSession()
    const libre = (await listFamilles()).data.find((item) => item.code === 'SEMEURS')
    if (!libre) throw new Error('famille Semeurs absente')

    await expect(deleteFamille(libre.idFamille)).resolves.toBeUndefined()
    const remaining = await listFamilles()
    expect(remaining.data.some((item) => item.code === 'SEMEURS')).toBe(false)
  })

  it('interdit la création sans le droit familles.create', async () => {
    await ouvrirSession('accueil@eglise.org', 'Accueil2026!')

    await expect(
      createFamille({
        code: 'TEST',
        nom: 'Test',
        actif: true,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
