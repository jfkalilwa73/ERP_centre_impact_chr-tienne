import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CurrentUser, LoginResponse } from '@/types'

type AuthState = {
  accessToken: string | null
  /** Instant d'expiration de l'access token, en millisecondes epoch. */
  accessTokenExpiresAt: number | null
  user: CurrentUser | null
  openSession: (response: LoginResponse) => void
  setUser: (user: CurrentUser) => void
  closeSession: () => void
}

const emptySession = {
  accessToken: null,
  accessTokenExpiresAt: null,
  user: null,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...emptySession,

      // Le refresh token n'est volontairement ni stocké ni persisté : le contrat
      // n'expose aucune route de renouvellement, il serait donc inutilisable côté
      // navigateur tout en restant un secret valable 7 jours.
      openSession: (response) =>
        set({
          accessToken: response.accessToken,
          accessTokenExpiresAt: Date.now() + response.accessTokenExpiresIn * 1000,
          user: response.utilisateur,
        }),

      setUser: (user) => set({ user }),

      closeSession: () => set(emptySession),
    }),
    {
      name: 'erp-eglise-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        accessTokenExpiresAt: state.accessTokenExpiresAt,
        user: state.user,
      }),
    },
  ),
)

export function isSessionExpired(expiresAt: number | null): boolean {
  return expiresAt === null || Date.now() >= expiresAt
}

export function hasValidSession(state: Pick<AuthState, 'accessToken' | 'accessTokenExpiresAt'>) {
  return state.accessToken !== null && !isSessionExpired(state.accessTokenExpiresAt)
}

export const useIsAuthenticated = () => useAuthStore(hasValidSession)

export const useCurrentUser = () => useAuthStore((state) => state.user)

/** Vérifie une permission effective telle que renvoyée par /auth/me. */
export function useHasPermission(code: string): boolean {
  return useAuthStore((state) => state.user?.permissions?.includes(code) ?? false)
}
