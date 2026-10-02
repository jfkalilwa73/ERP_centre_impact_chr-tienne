import type {
  AffectationRole,
  AffectationRoleCreate,
  Compte,
  CompteCreate,
  ComptePage,
  CompteStatut,
  CompteUpdate,
} from '@/types'
import { PERMISSIONS } from '@/lib/permissions'
import { effectivePermissionsForCompte, refreshAccountAccess } from './access'
import { mockAccounts } from './fixtures'
import { mockDb } from './db'
import {
  apiUrl,
  authenticate,
  delay,
  errorResponse,
  forbidden,
  http,
  HttpResponse,
  requirePermission,
  revokeAccessTokensForCompte,
  unauthenticated,
} from './http'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function paginate(items: Compte[], page: number, limit: number): ComptePage {
  const total = items.length
  const start = (page - 1) * limit
  return {
    data: items.slice(start, start + limit),
    pagination: { page, limit, total },
  }
}

/** Garde le compte de démonstration aligné pour /auth/me et /auth/login. */
function syncAccountCompte(compte: Compte) {
  const account = mockAccounts.find(
    (candidate) => candidate.utilisateur.compte.idCompte === compte.idCompte,
  )
  if (account) account.utilisateur.compte = compte
}

function removeAccount(compteId: string) {
  const index = mockAccounts.findIndex(
    (candidate) => candidate.utilisateur.compte.idCompte === compteId,
  )
  if (index >= 0) mockAccounts.splice(index, 1)
}

export const compteHandlers = [
  http.get(apiUrl('comptes'), async ({ request }) => {
    await delay(200)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /comptes', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.COMPTES_READ)) return forbidden()

    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20) || 20))
    const q = url.searchParams.get('q')?.trim().toLowerCase()
    const statut = url.searchParams.get('statut') as CompteStatut | null

    const filtered = mockDb.comptes.filter((compte) => {
      if (statut && compte.statut !== statut) return false
      if (!q) return true
      return compte.email.toLowerCase().includes(q)
    })

    return HttpResponse.json(paginate(filtered, page, limit), { status: 200 })
  }),

  http.post(apiUrl('comptes'), async ({ request }) => {
    await delay(300)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('POST /comptes', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.COMPTES_CREATE)) return forbidden()

    const payload = (await request.json()) as Partial<CompteCreate>
    const idPersonne = payload.idPersonne?.trim()
    const email = payload.email?.trim().toLowerCase()
    const motDePasse = payload.motDePasse ?? ''

    if (!idPersonne) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
        { field: 'idPersonne', rule: 'required' },
      ])
    }
    if (!email || !EMAIL_PATTERN.test(email)) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
        { field: 'email', rule: email ? 'format' : 'required' },
      ])
    }
    if (motDePasse.length < 8) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
        { field: 'motDePasse', rule: 'minLength' },
      ])
    }

    const personne = mockDb.personnes.find((candidate) => candidate.idPersonne === idPersonne)
    if (!personne) return errorResponse(404, 'NOT_FOUND', 'Personne introuvable.')

    if (mockDb.comptes.some((compte) => compte.email.toLowerCase() === email)) {
      return errorResponse(409, 'CONFLICT', 'Cette adresse e-mail est déjà utilisée.')
    }
    if (mockDb.comptes.some((compte) => compte.idPersonne === idPersonne)) {
      return errorResponse(409, 'CONFLICT', 'Cette personne possède déjà un compte.')
    }

    const created: Compte = {
      idCompte: crypto.randomUUID(),
      idPersonne,
      email,
      statut: payload.statut ?? 'actif',
      mfaActive: false,
      dateCreation: new Date().toISOString(),
    }

    mockDb.comptes.unshift(created)
    mockAccounts.push({
      motDePasse,
      utilisateur: {
        compte: created,
        personne,
        roles: [],
        permissions: [],
      },
    })
    return HttpResponse.json(created, { status: 201 })
  }),

  http.get(apiUrl('comptes/:compteId'), async ({ params, request }) => {
    await delay(150)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /comptes/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.COMPTES_READ)) return forbidden()

    const compte = mockDb.comptes.find((candidate) => candidate.idCompte === params.compteId)
    if (!compte) return errorResponse(404, 'NOT_FOUND', 'Compte introuvable.')

    return HttpResponse.json(compte, { status: 200 })
  }),

  http.patch(apiUrl('comptes/:compteId'), async ({ params, request }) => {
    await delay(250)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('PATCH /comptes/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.COMPTES_UPDATE)) return forbidden()

    const compte = mockDb.comptes.find((candidate) => candidate.idCompte === params.compteId)
    if (!compte) return errorResponse(404, 'NOT_FOUND', 'Compte introuvable.')

    const payload = (await request.json()) as CompteUpdate
    if (Object.keys(payload).length === 0) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.')
    }

    if (payload.email !== undefined) {
      const email = payload.email.trim().toLowerCase()
      if (!EMAIL_PATTERN.test(email)) {
        return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
          { field: 'email', rule: 'format' },
        ])
      }
      const taken = mockDb.comptes.some(
        (candidate) =>
          candidate.idCompte !== compte.idCompte && candidate.email.toLowerCase() === email,
      )
      if (taken) return errorResponse(409, 'CONFLICT', 'Cette adresse e-mail est déjà utilisée.')
    }

    const nextPassword = payload.motDePasse?.trim()
    if (nextPassword) {
      if (nextPassword.length < 8) {
        return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
          { field: 'motDePasse', rule: 'minLength' },
        ])
      }
      const account = mockAccounts.find(
        (candidate) => candidate.utilisateur.compte.idCompte === compte.idCompte,
      )
      if (account) account.motDePasse = nextPassword
    }

    const statut = payload.statut ?? compte.statut
    Object.assign(compte, {
      ...(payload.email !== undefined ? { email: payload.email.trim().toLowerCase() } : {}),
      ...(payload.statut !== undefined ? { statut: payload.statut } : {}),
      ...(payload.mfaActive !== undefined ? { mfaActive: payload.mfaActive } : {}),
      // Le contrat expose dateDesactivation en lecture seule : c'est au serveur de la poser.
      ...(statut === 'desactive'
        ? { dateDesactivation: compte.dateDesactivation ?? new Date().toISOString() }
        : { dateDesactivation: undefined }),
    })

    syncAccountCompte(compte)
    refreshAccountAccess(compte.idCompte)
    if (compte.statut !== 'actif') {
      revokeAccessTokensForCompte(compte.idCompte)
    }
    return HttpResponse.json(compte, { status: 200 })
  }),

  http.delete(apiUrl('comptes/:compteId'), async ({ params, request }) => {
    await delay(200)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('DELETE /comptes/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.COMPTES_DELETE)) return forbidden()

    const index = mockDb.comptes.findIndex((candidate) => candidate.idCompte === params.compteId)
    if (index < 0) return errorResponse(404, 'NOT_FOUND', 'Compte introuvable.')

    const compte = mockDb.comptes[index]
    if (compte?.statut === 'actif') {
      return errorResponse(
        409,
        'CONFLICT',
        'Un compte actif ne peut pas être supprimé. Suspendez-le ou désactivez-le d’abord.',
      )
    }

    mockDb.comptes.splice(index, 1)
    mockDb.affectationsRole = mockDb.affectationsRole.filter(
      (affectation) => affectation.idCompte !== params.compteId,
    )
    removeAccount(String(params.compteId))
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(apiUrl('comptes/:compteId/roles'), async ({ params, request }) => {
    await delay(150)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /comptes/:id/roles', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.COMPTES_READ)) return forbidden()

    const compte = mockDb.comptes.find((candidate) => candidate.idCompte === params.compteId)
    if (!compte) return errorResponse(404, 'NOT_FOUND', 'Compte introuvable.')

    const affectations = mockDb.affectationsRole.filter(
      (affectation) => affectation.idCompte === params.compteId,
    )
    return HttpResponse.json(affectations, { status: 200 })
  }),

  http.post(apiUrl('comptes/:compteId/roles'), async ({ params, request }) => {
    await delay(250)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('POST /comptes/:id/roles', result.reason)
    // Attribuer un rôle relève de l'administration RBAC, pas de la simple gestion de compte.
    if (!requirePermission(result.account, PERMISSIONS.ROLES_MANAGE)) return forbidden()

    const compte = mockDb.comptes.find((candidate) => candidate.idCompte === params.compteId)
    if (!compte) return errorResponse(404, 'NOT_FOUND', 'Compte introuvable.')

    const payload = (await request.json()) as Partial<AffectationRoleCreate>
    const idRole = payload.idRole?.trim()
    if (!idRole) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
        { field: 'idRole', rule: 'required' },
      ])
    }

    const role = mockDb.roles.find((candidate) => candidate.idRole === idRole)
    if (!role) return errorResponse(404, 'NOT_FOUND', 'Rôle introuvable.')

    const dejaActif = mockDb.affectationsRole.some(
      (affectation) =>
        affectation.idCompte === params.compteId &&
        affectation.idRole === idRole &&
        affectation.actif,
    )
    if (dejaActif) return errorResponse(409, 'CONFLICT', 'Ce rôle est déjà attribué à ce compte.')

    const created: AffectationRole = {
      idCompte: String(params.compteId),
      idRole,
      dateDebut: payload.dateDebut ?? new Date().toISOString(),
      dateFin: payload.dateFin,
      actif: true,
    }

    mockDb.affectationsRole.unshift(created)
    refreshAccountAccess(String(params.compteId))
    return HttpResponse.json(created, { status: 201 })
  }),

  http.delete(apiUrl('comptes/:compteId/roles/:roleId'), async ({ params, request }) => {
    await delay(200)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) {
      return unauthenticated('DELETE /comptes/:id/roles/:id', result.reason)
    }
    if (!requirePermission(result.account, PERMISSIONS.ROLES_MANAGE)) return forbidden()

    const affectation = mockDb.affectationsRole.find(
      (candidate) =>
        candidate.idCompte === params.compteId &&
        candidate.idRole === params.roleId &&
        candidate.actif,
    )
    if (!affectation) return errorResponse(404, 'NOT_FOUND', 'Affectation active introuvable.')

    affectation.actif = false
    affectation.dateFin = new Date().toISOString()
    refreshAccountAccess(String(params.compteId))
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(apiUrl('comptes/:compteId/permissions/:permissionCode'), async ({ params, request }) => {
    await delay(150)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) {
      return unauthenticated('GET /comptes/:id/permissions/:code', result.reason)
    }
    if (!requirePermission(result.account, PERMISSIONS.COMPTES_READ)) return forbidden()

    const compte = mockDb.comptes.find((candidate) => candidate.idCompte === params.compteId)
    if (!compte) return errorResponse(404, 'NOT_FOUND', 'Compte introuvable.')

    const permissionCode = String(params.permissionCode)
    const rolesSource = mockDb.affectationsRole
      .filter((affectation) => affectation.idCompte === params.compteId && affectation.actif)
      .map((affectation) => affectation.idRole)

    return HttpResponse.json(
      {
        compteId: compte.idCompte,
        permissionCode,
        autorise: effectivePermissionsForCompte(compte.idCompte).includes(permissionCode),
        rolesSource,
      },
      { status: 200 },
    )
  }),
]
