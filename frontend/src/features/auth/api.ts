import { api } from '@/lib/apiClient'
import type { CurrentUser, LoginRequest, LoginResponse } from '@/types'

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', payload)
  return data
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const { data } = await api.get<CurrentUser>('/auth/me')
  return data
}

/** Laravel révoque les deux tokens de la session courante ; réponse 204. */
export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}
