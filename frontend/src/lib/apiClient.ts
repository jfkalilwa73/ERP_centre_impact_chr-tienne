import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { toApiError } from './apiError'

const LOGIN_PATH = '/auth/login'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
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