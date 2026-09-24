import { http, HttpResponse, delay } from 'msw'
import type { LoginRequest, LoginResponse } from '@/types'
import { refreshAccountAccess } from './access'
import { mockAccounts, suspendedAccountEmail } from './fixtures'
import { mockDb } from './db'
import {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  apiUrl,
  authenticate,
  errorResponse,
  unauthenticated,
} from './http'
import { siteHandlers } from './siteHandlers'
import { departementHandlers } from './departementHandlers'
import { personneHandlers } from './personneHandlers'
import { familleHandlers } from './familleHandlers'
import { compteHandlers } from './compteHandlers'
import { roleHandlers } from './roleHandlers'
import { permissionHandlers } from './permissionHandlers'
import { auditHandlers } from './auditHandlers'

function base64Url(value: object) {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** JWT non signé, de forme valide, suffisant pour la mise au point du frontend. */
function fakeJwt(subject: string, type: 'access' | 'refresh', ttlSeconds: number) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const header = base64Url({ alg: 'HS256', typ: 'JWT' })
  const payload = base64Url({ sub: subject, type, iat: issuedAt, exp: issuedAt + ttlSeconds })
  return `${header}.${payload}.mock-signature`
}

const authHandlers = [
  http.post(apiUrl('auth/login'), async ({ request }) => {
    await delay(500)

    const payload = (await request.json()) as Partial<LoginRequest>

    if (!payload.email || !payload.motDePasse) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
        { field: !payload.email ? 'email' : 'motDePasse', rule: 'required' },
      ])
    }

    if (payload.email.toLowerCase() === suspendedAccountEmail) {
      return errorResponse(403, 'ACCOUNT_SUSPENDED', 'Ce compte est suspendu.')
    }

    const account = mockAccounts.find(
      (candidate) =>
        candidate.utilisateur.compte.email.toLowerCase() === payload.email?.toLowerCase() &&
        candidate.motDePasse === payload.motDePasse,
    )

    if (!account) {
      return errorResponse(401, 'INVALID_CREDENTIALS', 'Adresse e-mail ou mot de passe incorrect.')
    }

    refreshAccountAccess(account.utilisateur.compte.idCompte)

    const personne =
      mockDb.personnes.find(
        (candidate) => candidate.idPersonne === account.utilisateur.compte.idPersonne,
      ) ?? account.utilisateur.personne

    const body: LoginResponse = {
      accessToken: fakeJwt(account.utilisateur.compte.idCompte, 'access', ACCESS_TOKEN_TTL),
      refreshToken: fakeJwt(account.utilisateur.compte.idCompte, 'refresh', REFRESH_TOKEN_TTL),
      tokenType: 'Bearer',
      accessTokenExpiresIn: ACCESS_TOKEN_TTL,
      refreshTokenExpiresIn: REFRESH_TOKEN_TTL,
      utilisateur: { ...account.utilisateur, personne },
    }

    return HttpResponse.json(body, { status: 200 })
  }),

  http.get(apiUrl('auth/me'), async ({ request }) => {
    await delay(200)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /auth/me', result.reason)

    refreshAccountAccess(result.account.utilisateur.compte.idCompte)

    const personne =
      mockDb.personnes.find(
        (candidate) => candidate.idPersonne === result.account.utilisateur.compte.idPersonne,
      ) ?? result.account.utilisateur.personne

    return HttpResponse.json(
      { ...result.account.utilisateur, personne },
      { status: 200 },
    )
  }),

  http.post(apiUrl('auth/logout'), async ({ request }) => {
    await delay(200)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('POST /auth/logout', result.reason)

    return new HttpResponse(null, { status: 204 })
  }),
]

export const handlers = [
  ...authHandlers,
  ...siteHandlers,
  ...departementHandlers,
  ...personneHandlers,
  ...familleHandlers,
  ...compteHandlers,
  ...roleHandlers,
  ...permissionHandlers,
  ...auditHandlers,
]
