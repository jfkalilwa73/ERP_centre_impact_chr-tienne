import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CurrentUser, LoginResponse } from '@/types'

type SessionProfil = {
  id: number
  name: string
  email: string
  statut: string
  permissions?: string[]
}

type AuthState = {
  authenticated: boolean
  accessToken: string | null
  profil: SessionProfil | null
  user: CurrentUser | null
  openSession: (response: LoginResponse) => void
  setUser: (user: CurrentUser) => void
  closeSession: () => void
}

const emptySession = {
  authenticated: false,
  accessToken: null,
  profil: null,
  user: null,
}

function profilFromUser(user: CurrentUser): SessionProfil {
  const prenom = user.personne.prenom?.trim() ?? ''
  const nom = user.personne.nom?.trim() ?? ''
  return {
    id: Number(user.compte.idCompte) || 0,
    name: `${prenom} ${nom}`.trim() || user.compte.email,
    email: user.compte.email,
    statut: user.compte.statut,
    permissions: [...user.permissions],
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...emptySession,

      openSession: (response) =>
        set({
          authenticated: true,
          accessToken: response.accessToken || null,
          user: response.utilisateur,
          profil: profilFromUser(response.utilisateur),
        }),

      setUser: (user) =>
        set((state) => ({
          user,
          authenticated: true,
          profil: state.profil
            ? {
                ...state.profil,
                email: user.compte.email,
                statut: user.compte.statut,
                permissions: [...user.permissions],
                name: profilFromUser(user).name,
              }
            : profilFromUser(user),
        })),

      closeSession: () => set(emptySession),
    }),
    {
      name: 'erp-eglise-auth',
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: import.meta.env.MODE === 'test',
      partialize: (state) => ({
        authenticated: state.authenticated,
        accessToken: state.accessToken,
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
  return useAuthStore((state) => {
    const fromUser = state.user?.permissions
    if (fromUser && fromUser.length > 0) return fromUser.includes(code)
    return state.profil?.permissions?.includes(code) ?? false
  })
}