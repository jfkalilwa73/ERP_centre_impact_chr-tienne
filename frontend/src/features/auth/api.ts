import axios from 'axios'
import { api } from '@/lib/apiClient'
import type { CurrentUser, LoginRequest, LoginResponse } from '@/types'
import { currentUserFromSession, type SessionPayload } from './sessionUser'

function csrfCookieUrl(): string {
  const base = import.meta.env.VITE_API_URL
  if (base.startsWith('http')) {
    return `${new URL(base).origin}/sanctum/csrf-cookie`
  }
  return '/sanctum/csrf-cookie'
}

export async function ensureCsrfCookie(): Promise<void> {
  if (import.meta.env.MODE === 'test') return
  await axios.get(csrfCookieUrl(), {
    withCredentials: true,
    withXSRFToken: true,
  })
}

function isLoginResponse(body: unknown): body is LoginResponse {
  return Boolean(body && typeof body === 'object' && 'utilisateur' in body && 'accessToken' in body)
}

function isCurrentUser(body: unknown): body is CurrentUser {
  return Boolean(
    body && typeof body === 'object' && 'compte' in body && 'personne' in body && 'permissions' in body,
  )
}

function loginResponseFromSession(session: SessionPayload): LoginResponse {
  return {
    accessToken: '',
    refreshToken: '',
    tokenType: 'Bearer',
    accessTokenExpiresIn: 3600,
    refreshTokenExpiresIn: 604800,
    utilisateur: currentUserFromSession(session),
  }
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  await ensureCsrfCookie()
  const { data } = await api.post<LoginResponse | { data: SessionPayload }>('/auth/login', {
    email: payload.email,
    password: payload.motDePasse,
    motDePasse: payload.motDePasse,
  })
  if (isLoginResponse(data)) return data
  return loginResponseFromSession(data.data)
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const { data } = await api.get<CurrentUser | { data: SessionPayload }>('/auth/me')
  if (isCurrentUser(data)) return data
  return currentUserFromSession(data.data)
}

export async function logout(): Promise<void> {
  await ensureCsrfCookie()
  await api.post('/auth/logout')
}
