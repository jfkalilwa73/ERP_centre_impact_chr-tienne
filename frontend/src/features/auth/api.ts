import axios from 'axios'
import { api } from '@/lib/apiClient'
import type { LoginRequest } from '@/types'

export type SessionProfil = {
  id: number
  name: string
  email: string
  statut: string
}

function csrfCookieUrl(): string {
  const base = import.meta.env.VITE_API_URL
  if (base.startsWith('http')) {
    return `${new URL(base).origin}/sanctum/csrf-cookie`
  }
  return '/sanctum/csrf-cookie'
}

export async function ensureCsrfCookie(): Promise<void> {
  await axios.get(csrfCookieUrl(), {
    withCredentials: true,
    withXSRFToken: true,
  })
}

export async function login(payload: LoginRequest): Promise<SessionProfil> {
  await ensureCsrfCookie()
  const { data } = await api.post<{ data: SessionProfil }>('/auth/login', {
    email: payload.email,
    password: payload.motDePasse,
  })
  return data.data
}

export async function getCurrentUser(): Promise<SessionProfil> {
  const { data } = await api.get<{ data: SessionProfil }>('/auth/me')
  return data.data
}

export async function logout(): Promise<void> {
  await ensureCsrfCookie()
  await api.post('/auth/logout')
}