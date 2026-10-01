import { describe, expect, it } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import {
  createPermission,
  deletePermission,
  listPermissionRoles,
  listPermissionTitulaires,
  listPermissions,
  updatePermission,
} from './api'

const identifiants = { email: 'admin@eglise.org', motDePasse: 'SecurePass123!' }

async function ouvrirSession(email = identifiants.email, motDePasse = identifiants.motDePasse) {
  const { login } = await import('@/features/auth/api')
  const response = await login({ email, motDePasse })
  useAuthStore.getState().openSession(response)
  return response
}

describe('API permissions', () => {
  it('liste les permissions paginées', async () => {
    await ouvrirSession()

    const page = await listPermissions({ page: 1, limit: 100 })

    expect(page.pagination.total).toBeGreaterThanOrEqual(18)
    expect(page.data.map((permission) => permission.code)).toContain('roles.manage')
  })

  it('filtre par module', async () => {
    await ouvrirSession()

    const page = await listPermissions({ module: 'audit' })

    expect(page.data).toHaveLength(1)
    expect(page.data[0]?.code).toBe('audit.read')
  })

  it('crée une permission puis refuse un code déjà pris', async () => {
    await ouvrirSession()

    const created = await createPermission({
      code: 'rapports.export',
      module: 'rapports',
      action: 'export',
      actif: true,
    })

    expect(created.idPermission).toBeTruthy()
    expect(created.code).toBe('rapports.export')

    await expect(
      createPermission({
        code: 'rapports.export',
        module: 'rapports',
        action: 'export',
        actif: true,
      }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' })
  })

  it('modifie une permission existante', async () => {
    await ouvrirSession()
    const [permission] = (await listPermissions({ q: 'membres.read' })).data
    if (!permission) throw new Error('permission membres.read absente')

    const updated = await updatePermission(permission.idPermission, {
      description: 'Consulter le répertoire des personnes',
    })

    expect(updated.description).toBe('Consulter le répertoire des personnes')
  })

  it("refuse la suppression d'une permission encore attribuée", async () => {
    await ouvrirSession()
    const occupee = (await listPermissions({ q: 'membres.read' })).data.find(
      (permission) => permission.code === 'membres.read',
    )
    if (!occupee) throw new Error('permission membres.read absente')

    await expect(deletePermission(occupee.idPermission)).rejects.toMatchObject({ status: 409 })
  })

  it("supprime une permission inutilisée", async () => {
    await ouvrirSession()
    const created = await createPermission({
      code: 'rapports.archive',
      module: 'rapports',
      action: 'archive',
      actif: true,
    })

    await expect(deletePermission(created.idPermission)).resolves.toBeUndefined()
    const remaining = await listPermissions({ q: 'rapports.archive' })
    expect(remaining.data.some((permission) => permission.code === 'rapports.archive')).toBe(false)
  })

  it('liste les rôles et les personnes qui ont budget.request', async () => {
    await ouvrirSession()
    const permission = (await listPermissions({ q: 'budget.request', limit: 100 })).data.find(
      (item) => item.code === 'budget.request',
    )
    if (!permission) throw new Error('permission budget.request absente')

    const roles = await listPermissionRoles(permission.idPermission)
    const titulaires = await listPermissionTitulaires(permission.idPermission)

    expect(roles.map((role) => role.nom)).toEqual(
      expect.arrayContaining(['Chef de département', "Chef de famille d'impact"]),
    )
    expect(titulaires.map((item) => item.email)).toEqual(
      expect.arrayContaining(['chef-louange@eglise.org', 'chef-famille@eglise.org']),
    )
    expect(titulaires.map((item) => `${item.prenom} ${item.nom}`)).toEqual(
      expect.arrayContaining(['Pierre MWAMBA', 'Ruth NGOY']),
    )
  })

  it('interdit la lecture sans le droit roles.manage', async () => {
    await ouvrirSession('accueil@eglise.org', 'Accueil2026!')

    await expect(listPermissions()).rejects.toMatchObject({ status: 403 })
  })
})
