import { describe, expect, it } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import { getCurrentUser, login, logout } from './api'

const identifiants = { email: 'admin@eglise.org', motDePasse: 'SecurePass123!' }

describe("parcours d'authentification", () => {
  it('ouvre une session conforme au contrat', async () => {
    const response = await login(identifiants)

    expect(response.tokenType).toBe('Bearer')
    expect(response.accessTokenExpiresIn).toBe(3600)
    expect(response.refreshTokenExpiresIn).toBe(604800)
    expect(response.utilisateur.compte.email).toBe(identifiants.email)
    expect(response.utilisateur.permissions).toContain('membres.read')
  })

  it("rejette des identifiants invalides avec un message lisible", async () => {
    await expect(login({ ...identifiants, motDePasse: 'MauvaisMotDePasse' })).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
    })
  })

  it('joint le Bearer de la session aux appels suivants', async () => {
    const response = await login(identifiants)
    useAuthStore.getState().openSession(response)

    const utilisateur = await getCurrentUser()

    expect(utilisateur.compte.idCompte).toBe(response.utilisateur.compte.idCompte)
  })

  it('refuse /auth/me sans session ouverte', async () => {
    await expect(getCurrentUser()).rejects.toMatchObject({ status: 401 })
  })

  it('ferme la session côté serveur', async () => {
    const response = await login(identifiants)
    useAuthStore.getState().openSession(response)

    await expect(logout()).resolves.toBeUndefined()
  })

  it("ferme la session locale dès qu'un appel authentifié renvoie 401", async () => {
    const response = await login(identifiants)
    useAuthStore.getState().openSession(response)

    // Simule une révocation serveur : le contrat n'offre aucun renouvellement,
    // la session locale doit donc être abandonnée.
    useAuthStore.setState({ accessToken: 'jeton.revoque.invalide' })
    await expect(getCurrentUser()).rejects.toMatchObject({ status: 401 })

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })
})
