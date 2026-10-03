import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CurrentUser } from '@/types'

type SessionProfil = {
  id: number
  name: string
  email: string
  statut: string
}

type AuthState = {
  authenticated: boolean
  profil: SessionProfil | null
  user: CurrentUser | null
  openSession: (profil: SessionProfil) => void
  setUser: (user: CurrentUser) => void
  closeSession: () => void
}

const emptySession = {
  authenticated: false,
  profil: null,
  user: null,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...emptySession,

      openSession: (profil) =>
        set({
          authenticated: true,
          profil,
        }),

      setUser: (user) => set({ user, authenticated: true }),

      closeSession: () => set(emptySession),
    }),
    {
      name: 'erp-eglise-auth',
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: import.meta.env.MODE === 'test',
      partialize: (state) => ({
        authenticated: state.authenticated,
        profil: state.profil,
        user: state.user,
      }),
    },
  ),
)

export function hasValidSession(state: Pick<AuthState, 'authenticated'>): boolean {
  return state.authenticated
}

export const useIsAuthenticated = () => useAuthStore(hasValidSession)

export const useCurrentUser = () => useAuthStore((state) => state.user)

export const useSessionProfil = () => useAuthStore((state) => state.profil)

export function useHasPermission(code: string): boolean {
  return useAuthStore((state) => state.user?.permissions?.includes(code) ?? false)
}