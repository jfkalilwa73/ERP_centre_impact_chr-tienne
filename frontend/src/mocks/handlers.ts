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
  fakeJwt,
  issueAccessToken,
  revokeAccessToken,
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
import { sprint1Handlers } from './sprint1Handlers'

const authHandlers = [
  http.post(apiUrl('auth/login'), async ({ request }) => {
    await delay(500)

    const payload = (await request.json()) as Partial<LoginRequest> & { password?: string }
    const motDePasse = payload.motDePasse || payload.password

    if (!payload.email || !motDePasse) {
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
        candidate.motDePasse === motDePasse,
    )

    if (!account) {
      return errorResponse(401, 'INVALID_CREDENTIALS', 'Adresse e-mail ou mot de passe incorrect.')
    }

    const compte = mockDb.comptes.find(
      (candidate) => candidate.idCompte === account.utilisateur.compte.idCompte,
    )
    if (compte) account.utilisateur.compte = { ...account.utilisateur.compte, ...compte }
    if (account.utilisateur.compte.statut !== 'actif') {
      return errorResponse(403, 'ACCOUNT_SUSPENDED', 'Ce compte est suspendu.')
    }

    refreshAccountAccess(account.utilisateur.compte.idCompte)

    const personne =
      mockDb.personnes.find(
        (candidate) => candidate.idPersonne === account.utilisateur.compte.idPersonne,
      ) ?? account.utilisateur.personne

    const body: LoginResponse = {
      accessToken: issueAccessToken(account.utilisateur.compte.idCompte),
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
    const header = request.headers.get('Authorization')
    if (header?.startsWith('Bearer ')) revokeAccessToken(header.slice('Bearer '.length))

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
  ...sprint1Handlers,
]
