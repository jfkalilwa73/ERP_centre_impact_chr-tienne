import { http, HttpResponse, delay } from 'msw'
import type { ErrorResponse } from '@/types'
import { mockAccounts, type MockAccount } from './fixtures'

export const ACCESS_TOKEN_TTL = 3600
export const REFRESH_TOKEN_TTL = 604800

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

  const [, payload] = header.slice('Bearer '.length).split('.')
  if (!payload) return { authenticated: false, reason: 'jeton mal formé' }

  let claims: { sub?: string; exp?: number }
  try {
    claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch (error) {
    return {
      authenticated: false,
      reason: `charge utile illisible (${error instanceof Error ? error.message : 'erreur inconnue'})`,
    }
  }

  if (!claims.sub) return { authenticated: false, reason: 'revendication sub absente' }
  if (claims.exp && claims.exp * 1000 < Date.now()) {
    return { authenticated: false, reason: 'jeton expiré' }
  }

  const account = mockAccounts.find(
    (candidate) => candidate.utilisateur.compte.idCompte === claims.sub,
  )
  if (!account) return { authenticated: false, reason: `aucun compte pour le sujet ${claims.sub}` }

  return { authenticated: true, account }
}

export function requirePermission(account: MockAccount, code: string) {
  return account.utilisateur.permissions.includes(code)
}

export { delay, http, HttpResponse }
