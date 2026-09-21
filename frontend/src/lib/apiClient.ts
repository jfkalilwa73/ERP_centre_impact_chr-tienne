import axios from 'axios'
import { hasValidSession, useAuthStore } from '@/stores/authStore'
import { toApiError } from './apiError'

const LOGIN_PATH = '/auth/login'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const state = useAuthStore.getState()

  // Sans route de renouvellement dans le contrat, un access token expiré est
  // définitivement perdu : on ferme la session au lieu d'envoyer un token mort.
  if (state.accessToken && !hasValidSession(state)) {
    state.closeSession()
    return config
  }

  if (state.accessToken) {
    config.headers.Authorization = `Bearer ${state.accessToken}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    const isLoginAttempt = axios.isAxiosError(error) && error.config?.url === LOGIN_PATH

    if (apiError.status === 401 && !isLoginAttempt) {
      useAuthStore.getState().closeSession()
    }

    return Promise.reject(apiError)
  },
)
