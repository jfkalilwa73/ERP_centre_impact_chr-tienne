import { describe, expect, it } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import {
  createRole,
  deleteRole,
  listRolePermissions,
  listRoles,
  updateRole,
} from './api'

const identifiants = { email: 'admin@eglise.org', motDePasse: 'SecurePass123!' }

async function ouvrirSession(email = identifiants.email, motDePasse = identifiants.motDePasse) {
  const { login } = await import('@/features/auth/api')
  const response = await login({ email, motDePasse })
  useAuthStore.getState().openSession(response)
  return response
}

describe('API rôles', () => {
  it('liste les rôles paginés', async () => {
    await ouvrirSession()

    const page = await listRoles({ page: 1, limit: 20 })

    expect(page.pagination.total).toBe(3)
    expect(page.data.map((role) => role.code)).toContain('ADMIN_FONCTIONNEL')
  })

  it('filtre par recherche textuelle', async () => {
    await ouvrirSession()

    const page = await listRoles({ q: 'accueil' })

    expect(page.data).toHaveLength(1)
    expect(page.data[0]?.code).toBe('RESPONSABLE_ACCUEIL')
  })

  it('crée un rôle puis refuse un code déjà pris', async () => {
    await ouvrirSession()

    const created = await createRole({
      code: 'SECRETAIRE',
      nom: 'Secrétaire',
      niveauConfidentialite: 1,
      actif: true,
    })

    expect(created.idRole).toBeTruthy()
    expect(created.code).toBe('SECRETAIRE')

    await expect(
      createRole({
        code: 'secretaire',
        nom: 'Doublon',
        niveauConfidentialite: 1,
        actif: true,
      }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' })
  })

  it('modifie un rôle existant', async () => {
    await ouvrirSession()
    const [role] = (await listRoles()).data
    if (!role) throw new Error('aucun rôle de démonstration')

    const updated = await updateRole(role.idRole, { nom: 'Administrateur — siège' })

    expect(updated.nom).toBe('Administrateur — siège')
  })

  it("refuse la suppression d'un rôle encore attribué", async () => {
    await ouvrirSession()
    const occupe = (await listRoles()).data.find((role) => role.code === 'ADMIN_FONCTIONNEL')
    if (!occupe) throw new Error('rôle admin absent')

    await expect(deleteRole(occupe.idRole)).rejects.toMatchObject({ status: 409 })
  })

  it("supprime un rôle inutilisé", async () => {
    await ouvrirSession()
    const created = await createRole({
      code: 'INVITE',
      nom: 'Invité',
      niveauConfidentialite: 1,
      actif: true,
    })

    await expect(deleteRole(created.idRole)).resolves.toBeUndefined()
    const remaining = await listRoles()
    expect(remaining.data.some((role) => role.code === 'INVITE')).toBe(false)
  })

  it("liste les permissions d'un rôle", async () => {
    await ouvrirSession()
    const accueil = (await listRoles()).data.find((role) => role.code === 'RESPONSABLE_ACCUEIL')
    if (!accueil) throw new Error('rôle accueil absent')

    const permissions = await listRolePermissions(accueil.idRole)

    expect(permissions.map((permission) => permission.code)).toEqual(
      expect.arrayContaining(['membres.read', 'sites.read', 'departements.read']),
    )
  })

  it('interdit la lecture sans le droit roles.manage', async () => {
    await ouvrirSession('accueil@eglise.org', 'Accueil2026!')

    await expect(listRoles()).rejects.toMatchObject({ status: 403 })
  })
})
