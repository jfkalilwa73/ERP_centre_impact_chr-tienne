import { describe, expect, it } from 'vitest'
import { seedSites } from '@/mocks/fixtures'
import { useAuthStore } from '@/stores/authStore'
import {
  createDepartement,
  deleteDepartement,
  getDepartement,
  listDepartements,
  updateDepartement,
} from './api'

const identifiants = { email: 'admin@eglise.org', motDePasse: 'SecurePass123!' }
const siteCentral = seedSites[0]
const siteLimete = seedSites[1]

async function ouvrirSession(email = identifiants.email, motDePasse = identifiants.motDePasse) {
  const { login } = await import('@/features/auth/api')
  const response = await login({ email, motDePasse })
  useAuthStore.getState().openSession(response)
  return response
}

describe('API départements', () => {
  it('liste les départements paginés', async () => {
    await ouvrirSession()

    const page = await listDepartements({ page: 1, limit: 20 })

    expect(page.pagination.total).toBe(4)
    expect(page.data.map((departement) => departement.code)).toContain('ACCUEIL')
    expect(page.data.map((departement) => departement.code)).toContain('CAISSE')
  })

  it('filtre par site', async () => {
    await ouvrirSession()
    if (!siteLimete) throw new Error('site Limete absent du jeu de démonstration')

    const page = await listDepartements({ siteId: siteLimete.idSite })

    expect(page.data).toHaveLength(0)
  })

  it('crée un département puis refuse un code déjà pris sur le même site', async () => {
    await ouvrirSession()
    if (!siteCentral || !siteLimete) throw new Error('sites de démonstration absents')

    const created = await createDepartement({
      code: 'MEDIA',
      nom: 'Département Média',
      idSite: siteCentral.idSite,
      actif: true,
    })

    expect(created.code).toBe('MEDIA')
    expect(created.idSite).toBe(siteCentral.idSite)

    await expect(
      createDepartement({
        code: 'media',
        nom: 'Doublon',
        idSite: siteCentral.idSite,
        actif: true,
      }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' })

    const copieSurAutreSite = await createDepartement({
      code: 'MEDIA',
      nom: 'Média Limete',
      idSite: siteLimete.idSite,
      actif: true,
    })
    expect(copieSurAutreSite.idSite).toBe(siteLimete.idSite)
  })

  it('refuse un rattachement à un site inexistant', async () => {
    await ouvrirSession()

    await expect(
      createDepartement({
        code: 'TEST',
        nom: 'Test',
        idSite: '00000000-0000-4000-8000-000000000000',
        actif: true,
      }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('modifie un département existant', async () => {
    await ouvrirSession()
    const [departement] = (await listDepartements()).data
    if (!departement) throw new Error('aucun département de démonstration')

    const updated = await updateDepartement(departement.idDepartement, {
      nom: 'Accueil et orientation',
    })

    expect(updated.nom).toBe('Accueil et orientation')
  })

  it("refuse la suppression d'un département encore utilisé", async () => {
    await ouvrirSession()
    const occupe = (await listDepartements()).data.find((item) => item.code === 'ACCUEIL')
    if (!occupe) throw new Error('département Accueil absent')

    await expect(deleteDepartement(occupe.idDepartement)).rejects.toMatchObject({ status: 409 })
  })

  it("supprime un département inutilisé", async () => {
    await ouvrirSession()
    const libre = (await listDepartements()).data.find((item) => item.code === 'DIAKONIE')
    if (!libre) throw new Error('département Diaconie absent')

    await expect(deleteDepartement(libre.idDepartement)).resolves.toBeUndefined()
    const remaining = await listDepartements()
    expect(remaining.data.some((item) => item.code === 'DIAKONIE')).toBe(false)
  })

  it('interdit la fiche d’un département hors périmètre', async () => {
    await ouvrirSession('accueil@eglise.org', 'Accueil2026!')
    const louange = (await listDepartements()).data.find((item) => item.code === 'LOUANGE')
    if (!louange) throw new Error('département Louange absent')

    await expect(getDepartement(louange.idDepartement)).rejects.toMatchObject({ status: 403 })
  })

  it('laisse le chef lire son département', async () => {
    await ouvrirSession('chef-louange@eglise.org', 'ChefDep2026!')
    const departement = await getDepartement('d4f6b8c0-0006-4000-8000-000000000002')
    expect(departement.code).toBe('LOUANGE')
  })

  it('interdit la création sans le droit departements.create', async () => {
    await ouvrirSession('accueil@eglise.org', 'Accueil2026!')
    if (!siteCentral) throw new Error('site central absent')

    await expect(
      createDepartement({
        code: 'TEST',
        nom: 'Test',
        idSite: siteCentral.idSite,
        actif: true,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
