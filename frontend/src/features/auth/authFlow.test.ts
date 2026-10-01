import { describe, expect, it } from 'vitest'
import { updateCompte } from '@/features/comptes/api'
import { updatePermission, listPermissions } from '@/features/permissions/api'
import { listRoles, updateRole } from '@/features/roles/api'
import { ACCESS_TOKEN_TTL, fakeJwt } from '@/mocks/http'
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

  it('retire un droit de la session courante sans se reconnecter', async () => {
    const response = await login(identifiants)
    useAuthStore.getState().openSession(response)
    expect(response.utilisateur.permissions).toContain('membres.read')

    const permission = (await listPermissions({ q: 'membres.read', limit: 100 })).data.find(
      (item) => item.code === 'membres.read',
    )
    if (!permission) throw new Error('permission membres.read absente')

    await updatePermission(permission.idPermission, { actif: false })

    const utilisateur = await getCurrentUser()
    expect(utilisateur.permissions).not.toContain('membres.read')
    expect(utilisateur.permissions).toContain('roles.manage')
  })

  it('retire les droits d’un rôle inactif sans se reconnecter', async () => {
    const chef = await login({ email: 'chef-louange@eglise.org', motDePasse: 'ChefDep2026!' })
    expect(chef.utilisateur.permissions).toContain('budget.request')

    const admin = await login(identifiants)
    useAuthStore.getState().openSession(admin)
    const role = (await listRoles({ q: 'département', limit: 100 })).data.find(
      (item) => item.code === 'CHEF_DEPARTEMENT',
    )
    if (!role) throw new Error('rôle chef de département absent')
    await updateRole(role.idRole, { actif: false })

    useAuthStore.getState().openSession(chef)
    const utilisateur = await getCurrentUser()
    expect(utilisateur.roles.some((item) => item.code === 'CHEF_DEPARTEMENT')).toBe(false)
    expect(utilisateur.permissions).not.toContain('budget.request')
  })

  it('coupe immédiatement la session d’un compte désactivé', async () => {
    const chef = await login({ email: 'chef-louange@eglise.org', motDePasse: 'ChefDep2026!' })

    const admin = await login(identifiants)
    useAuthStore.getState().openSession(admin)
    await updateCompte(chef.utilisateur.compte.idCompte, { statut: 'suspendu' })

    useAuthStore.getState().openSession(chef)
    await expect(getCurrentUser()).rejects.toMatchObject({ status: 401 })
    await expect(
      login({ email: 'chef-louange@eglise.org', motDePasse: 'ChefDep2026!' }),
    ).rejects.toMatchObject({ status: 403, code: 'ACCOUNT_SUSPENDED' })
  })

  it('refuse un jeton forgé qui n’a pas été émis à la connexion', async () => {
    const response = await login(identifiants)
    useAuthStore.getState().openSession({
      ...response,
      accessToken: fakeJwt(response.utilisateur.compte.idCompte, 'access', ACCESS_TOKEN_TTL),
    })

    await expect(getCurrentUser()).rejects.toMatchObject({ status: 401 })
  })
})
