import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore, useIsAuthenticated } from '@/stores/authStore'
import type { ApiError } from '@/lib/apiError'
import type { LoginRequest, LoginResponse } from '@/types'
import { getCurrentUser, login, logout } from './api'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

export function invalidateCurrentUser(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: authKeys.me })
}

export function useLogin() {
  const openSession = useAuthStore((state) => state.openSession)

  return useMutation<LoginResponse, ApiError, LoginRequest>({
    mutationFn: login,
    onSuccess: openSession,
  })
}

export function useLogout() {
  const closeSession = useAuthStore((state) => state.closeSession)
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, void>({
    mutationFn: logout,
    // La session locale est fermée même si la révocation serveur échoue :
    // l'utilisateur doit toujours pouvoir quitter l'application.
    onSettled: () => {
      closeSession()
      queryClient.clear()
    },
  })
}

/**
 * Rafraîchit le contexte courant (rôles et permissions effectifs) au montage de
 * l'application : les droits peuvent avoir changé depuis l'ouverture de session.
 */
export function useSyncCurrentUser() {
  const isAuthenticated = useIsAuthenticated()
  const setUser = useAuthStore((state) => state.setUser)
  const closeSession = useAuthStore((state) => state.closeSession)

  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: getCurrentUser,
    enabled: isAuthenticated,
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!query.data) return
    if (query.data.compte.statut !== 'actif') {
      closeSession()
      return
    }
    setUser(query.data)
  }, [closeSession, query.data, setUser])

  return query
}
