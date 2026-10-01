import { http, HttpResponse, delay } from 'msw'
import type { ErrorResponse } from '@/types'
import { mockAccounts, type MockAccount } from './fixtures'
import { mockDb } from './db'

export const ACCESS_TOKEN_TTL = 3600
export const REFRESH_TOKEN_TTL = 604800

const issuedAccessTokens = new Map<string, string>()

function base64Url(value: object) {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** JWT non signé, de forme valide. Seuls les jetons émis à la connexion sont acceptés. */
export function fakeJwt(subject: string, type: 'access' | 'refresh', ttlSeconds: number) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const header = base64Url({ alg: 'HS256', typ: 'JWT' })
  const payload = base64Url({
    sub: subject,
    type,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
    jti: crypto.randomUUID(),
  })
  return `${header}.${payload}.mock-signature`
}

export function issueAccessToken(subject: string) {
  const token = fakeJwt(subject, 'access', ACCESS_TOKEN_TTL)
  issuedAccessTokens.set(token, subject)
  return token
}

export function revokeAccessToken(token: string) {
  issuedAccessTokens.delete(token)
}

export function revokeAccessTokensForCompte(idCompte: string) {
  for (const [token, subject] of issuedAccessTokens) {
    if (subject === idCompte) issuedAccessTokens.delete(token)
  }
}

export function resetIssuedTokens() {
  issuedAccessTokens.clear()
}

export const apiUrl = (path: string) =>
  new URL(path, `${import.meta.env.VITE_API_URL}/`).toString()

export function errorResponse(status: number, code: string, message: string, details?: unknown[]) {
  const body: ErrorResponse = {
    status,
    code,
    message,
    requestId: `req_mock_${Math.random().toString(36).slice(2, 10)}`,
    ...(details ? { details: details as ErrorResponse['details'] } : {}),
  }
  return HttpResponse.json(body, { status })
}

export function unauthenticated(path: string, reason: string) {
  console.warn(`[mock] ${path} refusé : ${reason}`)
  return errorResponse(401, 'UNAUTHENTICATED', 'Session absente, invalide ou expirée.')
}

export function forbidden() {
  return errorResponse(403, 'FORBIDDEN', "Vous n'avez pas la permission d'effectuer cette action.")
}

type Authentication =
  | { authenticated: true; account: MockAccount }
  | { authenticated: false; reason: string }

/**
 * Retrouve le compte à partir du Bearer forgé par le mock de /auth/login.
 * Un refus est toujours motivé et journalisé : un mock silencieux transforme
 * une erreur de câblage en énigme.
 */
export function authenticate(header: string | null): Authentication {
  if (!header) return { authenticated: false, reason: "en-tête Authorization absent" }
  if (!header.startsWith('Bearer ')) {
    return { authenticated: false, reason: 'schéma autre que Bearer' }
  }

  const raw = header.slice('Bearer '.length)
  if (!issuedAccessTokens.has(raw)) {
    return { authenticated: false, reason: 'jeton non émis ou révoqué' }
  }

  const [, payload] = raw.split('.')
  if (!payload) return { authenticated: false, reason: 'jeton mal formé' }

  let claims: { sub?: string; exp?: number; type?: string }
  try {
    claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch (error) {
    return {
      authenticated: false,
      reason: `charge utile illisible (${error instanceof Error ? error.message : 'erreur inconnue'})`,
    }
  }

  if (!claims.sub) return { authenticated: false, reason: 'revendication sub absente' }
  if (claims.type && claims.type !== 'access') {
    return { authenticated: false, reason: "type de jeton invalide" }
  }
  if (claims.exp && claims.exp * 1000 < Date.now()) {
    return { authenticated: false, reason: 'jeton expiré' }
  }

  const account = mockAccounts.find(
    (candidate) => candidate.utilisateur.compte.idCompte === claims.sub,
  )
  if (!account) return { authenticated: false, reason: `aucun compte pour le sujet ${claims.sub}` }

  const compte = mockDb.comptes.find((candidate) => candidate.idCompte === claims.sub)
  if (compte && compte.statut !== 'actif') {
    return { authenticated: false, reason: 'compte inactif' }
  }

  return { authenticated: true, account }
}

export function requirePermission(account: MockAccount, code: string) {
  return account.utilisateur.permissions.includes(code)
}

export { delay, http, HttpResponse }
