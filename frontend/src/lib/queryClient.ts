import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './apiError'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Une erreur 4xx est définitive (droits, validation, session close) :
      // seules les pannes réseau et les 5xx méritent un nouvel essai.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
    mutations: {
      retry: false,
    },
  },
})
