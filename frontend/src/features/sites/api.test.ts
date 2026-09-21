import { describe, expect, it } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import { createSite, deleteSite, listSites, updateSite } from './api'

const identifiants = { email: 'admin@eglise.org', motDePasse: 'SecurePass123!' }

async function ouvrirSession(email = identifiants.email, motDePasse = identifiants.motDePasse) {
  const { login } = await import('@/features/auth/api')
  const response = await login({ email, motDePasse })
  useAuthStore.getState().openSession(response)
  return response
}

describe('API sites', () => {
  it('liste les sites paginés', async () => {
    await ouvrirSession()

    const page = await listSites({ page: 1, limit: 20 })

    expect(page.pagination.total).toBe(3)
    expect(page.data.map((site) => site.code)).toContain('KIN-CENTRE')
  })

  it('filtre par recherche textuelle', async () => {
    await ouvrirSession()

    const page = await listSites({ q: 'limete' })

    expect(page.data).toHaveLength(1)
    expect(page.data[0]?.code).toBe('KIN-LIMETE')
  })

  it('crée un site puis refuse un code déjà pris', async () => {
    await ouvrirSession()

    const created = await createSite({
      code: 'GOM-CENTRE',
      nom: 'Site Goma',
      telephone: '+243810000030',
      ville: 'Goma',
      pays: 'RDC',
      actif: true,
    })

    expect(created.idSite).toBeTruthy()
    expect(created.code).toBe('GOM-CENTRE')

    await expect(
      createSite({
        code: 'gom-centre',
        nom: 'Doublon',
        telephone: '+243810000031',
        actif: true,
      }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' })
  })

  it('modifie un site existant', async () => {
    await ouvrirSession()
    const [site] = (await listSites()).data
    if (!site) throw new Error('aucun site de démonstration')

    const updated = await updateSite(site.idSite, { nom: 'Site central — siège' })

    expect(updated.nom).toBe('Site central — siège')
  })

  it("refuse la suppression d'un site encore utilisé", async () => {
    await ouvrirSession()
    const occupe = (await listSites()).data.find((site) => site.code === 'KIN-CENTRE')
    if (!occupe) throw new Error('site central absent')

    await expect(deleteSite(occupe.idSite)).rejects.toMatchObject({ status: 409 })
  })

  it("supprime un site inutilisé", async () => {
    await ouvrirSession()
    const libre = (await listSites()).data.find((site) => site.code === 'KIN-LIMETE')
    if (!libre) throw new Error('site Limete absent')

    await expect(deleteSite(libre.idSite)).resolves.toBeUndefined()
    const remaining = await listSites()
    expect(remaining.data.some((site) => site.code === 'KIN-LIMETE')).toBe(false)
  })

  it('interdit la création sans le droit sites.create', async () => {
    await ouvrirSession('accueil@eglise.org', 'Accueil2026!')

    await expect(
      createSite({
        code: 'TEST',
        nom: 'Test',
        telephone: '+243810000099',
        actif: true,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
