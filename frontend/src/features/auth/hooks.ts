import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore, useIsAuthenticated } from '@/stores/authStore'
import type { ApiError } from '@/lib/apiError'
import type { LoginRequest } from '@/types'
import { getCurrentUser, login, logout, type SessionProfil } from './api'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

export function invalidateCurrentUser(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: authKeys.me })
}

export function useLogin() {
  const openSession = useAuthStore((state) => state.openSession)

  return useMutation<SessionProfil, ApiError, LoginRequest>({
    mutationFn: login,
    onSuccess: openSession,
  })
}

export function useLogout() {
  const closeSession = useAuthStore((state) => state.closeSession)
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, void>({
    mutationFn: logout,
    onSettled: () => {
      closeSession()
      queryClient.clear()
    },
  })
}

export function useSyncCurrentUser() {
  const isAuthenticated = useIsAuthenticated()
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
    if (query.data.statut !== 'actif') {
      closeSession()
    }
  }, [closeSession, query.data])

  return query
}