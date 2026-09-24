import { describe, expect, it } from 'vitest'
import { seedComptes, seedPersonnes, seedRoles } from '@/mocks/fixtures'
import { useAuthStore } from '@/stores/authStore'
import {
  assignRoleToCompte,
  createCompte,
  createCompteWithRoles,
  deleteCompte,
  listComptes,
  listCompteRoles,
  unassignRoleFromCompte,
  updateCompte,
} from './api'

async function ouvrirSession(email = 'admin@eglise.org', motDePasse = 'SecurePass123!') {
  const { login } = await import('@/features/auth/api')
  const response = await login({ email, motDePasse })
  useAuthStore.getState().openSession(response)
  return response
}

describe('API comptes', () => {
  it('liste les comptes paginés', async () => {
    await ouvrirSession()

    const page = await listComptes({ page: 1, limit: 20 })

    expect(page.pagination.total).toBe(seedComptes.length)
    expect(page.data.map((compte) => compte.email)).toContain('admin@eglise.org')
  })

  it('filtre par statut puis par adresse e-mail', async () => {
    await ouvrirSession()

    const suspendus = await listComptes({ statut: 'suspendu' })
    expect(suspendus.data).toHaveLength(1)
    expect(suspendus.data[0]?.email).toBe('marie@eglise.org')

    const recherche = await listComptes({ q: 'pasteur' })
    expect(recherche.data.map((compte) => compte.email)).toEqual(['pasteur@eglise.org'])
  })

  it('crée un compte pour une personne qui n’en a pas', async () => {
    await ouvrirSession()

    // Chaque personne du jeu de démonstration a déjà un compte : on en ajoute une.
    const { createPersonne } = await import('@/features/personnes/api')
    const nouvelle = await createPersonne({ nom: 'NGOY', prenom: 'Ruth', statut: 'actif' })

    const created = await createCompte({
      idPersonne: nouvelle.idPersonne,
      email: 'ruth@eglise.org',
      motDePasse: 'SecurePass123!',
      statut: 'actif',
    })

    expect(created.email).toBe('ruth@eglise.org')
    expect(created.mfaActive).toBe(false)
  })

  it('crée un compte et lui attribue les rôles choisis', async () => {
    await ouvrirSession()
    const { createPersonne } = await import('@/features/personnes/api')
    const nouvelle = await createPersonne({ nom: 'ILUNGA', prenom: 'Sarah', statut: 'actif' })
    const accueilRole = seedRoles.find((role) => role.code === 'RESPONSABLE_ACCUEIL')
    const pasteurRole = seedRoles.find((role) => role.code === 'PASTEUR')
    if (!accueilRole || !pasteurRole) throw new Error('rôles absents')

    const created = await createCompteWithRoles(
      {
        idPersonne: nouvelle.idPersonne,
        email: 'sarah.ilunga@eglise.org',
        motDePasse: 'SecurePass123!',
        statut: 'actif',
      },
      [accueilRole.idRole, pasteurRole.idRole],
    )

    const affectations = await listCompteRoles(created.idCompte)
    const actifs = affectations.filter((affectation) => affectation.actif).map((item) => item.idRole)
    expect(actifs).toEqual(expect.arrayContaining([accueilRole.idRole, pasteurRole.idRole]))
  })

  it('refuse une adresse e-mail déjà prise', async () => {
    await ouvrirSession()
    const personne = seedPersonnes[0]
    if (!personne) throw new Error('personne absente')

    await expect(
      createCompte({
        idPersonne: personne.idPersonne,
        email: 'accueil@eglise.org',
        motDePasse: 'SecurePass123!',
      }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' })
  })

  it('refuse un second compte pour la même personne', async () => {
    await ouvrirSession()
    const personne = seedPersonnes[0]
    if (!personne) throw new Error('personne absente')

    await expect(
      createCompte({
        idPersonne: personne.idPersonne,
        email: 'doublon@eglise.org',
        motDePasse: 'SecurePass123!',
      }),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('refuse une personne inconnue', async () => {
    await ouvrirSession()

    await expect(
      createCompte({
        idPersonne: '00000000-0000-4000-8000-000000000000',
        email: 'inconnu@eglise.org',
        motDePasse: 'SecurePass123!',
      }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('suspend un compte et horodate la désactivation', async () => {
    await ouvrirSession()
    const pasteur = seedComptes.find((compte) => compte.email === 'pasteur@eglise.org')
    if (!pasteur) throw new Error('compte pasteur absent')

    const suspendu = await updateCompte(pasteur.idCompte, { statut: 'suspendu' })
    expect(suspendu.statut).toBe('suspendu')
    expect(suspendu.dateDesactivation).toBeUndefined()

    const desactive = await updateCompte(pasteur.idCompte, { statut: 'desactive' })
    expect(desactive.dateDesactivation).toBeTruthy()
  })

  it("refuse la suppression d'un compte actif", async () => {
    await ouvrirSession()
    const actif = seedComptes.find((compte) => compte.statut === 'actif')
    if (!actif) throw new Error('compte actif absent')

    await expect(deleteCompte(actif.idCompte)).rejects.toMatchObject({ status: 409 })
  })

  it('supprime un compte désactivé', async () => {
    await ouvrirSession()
    const desactive = seedComptes.find((compte) => compte.statut === 'desactive')
    if (!desactive) throw new Error('compte désactivé absent')

    await expect(deleteCompte(desactive.idCompte)).resolves.toBeUndefined()

    const restants = await listComptes()
    expect(restants.data.some((compte) => compte.idCompte === desactive.idCompte)).toBe(false)
  })

  it('interdit la création sans le droit comptes.create', async () => {
    await ouvrirSession('accueil@eglise.org', 'Accueil2026!')

    await expect(
      createCompte({
        idPersonne: seedPersonnes[0]!.idPersonne,
        email: 'lecture@eglise.org',
        motDePasse: 'SecurePass123!',
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('interdit la lecture sans le droit comptes.read', async () => {
    await ouvrirSession('accueil@eglise.org', 'Accueil2026!')

    await expect(listComptes()).rejects.toMatchObject({ status: 403 })
  })
})

describe('API rôles des comptes', () => {
  it("liste les rôles d'un compte", async () => {
    await ouvrirSession()
    const admin = seedComptes[0]
    if (!admin) throw new Error('compte admin absent')

    const affectations = await listCompteRoles(admin.idCompte)

    expect(affectations.some((affectation) => affectation.actif)).toBe(true)
  })

  it('attribue un rôle puis refuse le doublon actif', async () => {
    await ouvrirSession()
    const accueil = seedComptes.find((compte) => compte.email === 'accueil@eglise.org')
    const pasteurRole = seedRoles.find((role) => role.code === 'PASTEUR')
    if (!accueil || !pasteurRole) throw new Error('jeu de démonstration incomplet')

    const created = await assignRoleToCompte(accueil.idCompte, { idRole: pasteurRole.idRole })
    expect(created.actif).toBe(true)

    await expect(
      assignRoleToCompte(accueil.idCompte, { idRole: pasteurRole.idRole }),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('refuse un rôle inconnu', async () => {
    await ouvrirSession()
    const admin = seedComptes[0]
    if (!admin) throw new Error('compte admin absent')

    await expect(
      assignRoleToCompte(admin.idCompte, { idRole: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it("retire un rôle sans l'effacer de l'historique", async () => {
    await ouvrirSession()
    const accueil = seedComptes.find((compte) => compte.email === 'accueil@eglise.org')
    const accueilRole = seedRoles.find((role) => role.code === 'RESPONSABLE_ACCUEIL')
    if (!accueil || !accueilRole) throw new Error('jeu de démonstration incomplet')

    await unassignRoleFromCompte(accueil.idCompte, accueilRole.idRole)

    const affectations = await listCompteRoles(accueil.idCompte)
    const cloture = affectations.find((affectation) => affectation.idRole === accueilRole.idRole)
    expect(cloture?.actif).toBe(false)
    expect(cloture?.dateFin).toBeTruthy()
  })

  it('interdit l’attribution sans le droit roles.manage', async () => {
    await ouvrirSession('accueil@eglise.org', 'Accueil2026!')
    const accueil = seedComptes.find((compte) => compte.email === 'accueil@eglise.org')
    const adminRole = seedRoles[0]
    if (!accueil || !adminRole) throw new Error('jeu de démonstration incomplet')

    await expect(
      assignRoleToCompte(accueil.idCompte, { idRole: adminRole.idRole }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('applique les droits du rôle à la prochaine connexion', async () => {
    await ouvrirSession()
    const accueil = seedComptes.find((compte) => compte.email === 'accueil@eglise.org')
    const pasteurRole = seedRoles.find((role) => role.code === 'PASTEUR')
    if (!accueil || !pasteurRole) throw new Error('jeu de démonstration incomplet')

    await assignRoleToCompte(accueil.idCompte, { idRole: pasteurRole.idRole })

    const session = await ouvrirSession('accueil@eglise.org', 'Accueil2026!')
    expect(session.utilisateur.roles.some((role) => role.code === 'PASTEUR')).toBe(true)
    expect(session.utilisateur.permissions).toContain('pastorale.notes')
  })

  it('permet de se connecter après création, puis d’activer un rôle', async () => {
    await ouvrirSession()
    const { createPersonne } = await import('@/features/personnes/api')
    const { login } = await import('@/features/auth/api')
    const nouvelle = await createPersonne({ nom: 'KABILA', prenom: 'Esther', statut: 'actif' })
    const accueilRole = seedRoles.find((role) => role.code === 'RESPONSABLE_ACCUEIL')
    if (!accueilRole) throw new Error('rôle accueil absent')

    const created = await createCompte({
      idPersonne: nouvelle.idPersonne,
      email: 'esther.kabila@eglise.org',
      motDePasse: 'SecurePass123!',
      statut: 'actif',
    })

    const sansRole = await login({
      email: 'esther.kabila@eglise.org',
      motDePasse: 'SecurePass123!',
    })
    expect(sansRole.utilisateur.permissions).toEqual([])

    await assignRoleToCompte(created.idCompte, { idRole: accueilRole.idRole })

    const avecRole = await login({
      email: 'esther.kabila@eglise.org',
      motDePasse: 'SecurePass123!',
    })
    expect(avecRole.utilisateur.roles.some((role) => role.code === 'RESPONSABLE_ACCUEIL')).toBe(true)
    expect(avecRole.utilisateur.permissions.length).toBeGreaterThan(0)
  })
})
