import { AxiosError } from 'axios'
import type { ErrorResponse } from '@/types'

/** Erreur normalisée à partir du schéma ErrorResponse du contrat. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown[]
  readonly requestId?: string

  constructor(params: {
    status: number
    code: string
    message: string
    details?: unknown[]
    requestId?: string
  }) {
    super(params.message)
    this.name = 'ApiError'
    this.status = params.status
    this.code = params.code
    this.details = params.details ?? []
    this.requestId = params.requestId
  }

  get isNetworkError() {
    return this.status === 0
  }

  get isValidationError() {
    return this.status === 422
  }
}

const genericMessages: Record<number, string> = {
  401: 'Identifiants invalides ou session expirée.',
  403: "Vous n'avez pas la permission d'effectuer cette action.",
  404: 'Ressource introuvable.',
  409: "Cette opération entre en conflit avec l'état actuel des données.",
  422: 'Les données saisies ne sont pas conformes.',
  500: 'Une erreur interne est survenue. Réessayez plus tard.',
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (error instanceof AxiosError) {
    const response = error.response

    if (!response) {
      return new ApiError({
        status: 0,
        code: 'NETWORK_ERROR',
        message: "Le serveur est injoignable. Vérifiez votre connexion puis réessayez.",
      })
    }

    const body = response.data as Partial<ErrorResponse> | undefined

    return new ApiError({
      status: body?.status ?? response.status,
      code: body?.code ?? 'HTTP_ERROR',
      message: body?.message ?? genericMessages[response.status] ?? 'Une erreur est survenue.',
      details: body?.details,
      requestId: body?.requestId,
    })
  }

  return new ApiError({
    status: 0,
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : 'Une erreur inattendue est survenue.',
  })
}
