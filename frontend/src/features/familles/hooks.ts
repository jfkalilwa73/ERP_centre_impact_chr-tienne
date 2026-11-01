import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { assignPersonneFamille, unassignPersonneFamille } from '@/features/personnes/api'
import type { ApiError } from '@/lib/apiError'
import type {
  AffectationFamille,
  AffectationFamilleCreate,
  FamilleImpact,
  FamilleImpactCreate,
  FamilleImpactUpdate,
} from '@/types'
import {
  createFamille,
  deleteFamille,
  getFamille,
  listFamilles,
  updateFamille,
  type ListFamillesParams,
} from './api'

export const familleKeys = {
  all: ['familles'] as const,
  list: (params: ListFamillesParams) => [...familleKeys.all, 'list', params] as const,
  detail: (id: string) => [...familleKeys.all, 'detail', id] as const,
}

export function useFamilles(params: ListFamillesParams, enabled = true) {
  return useQuery({
    queryKey: familleKeys.list(params),
    queryFn: () => listFamilles(params),
    enabled,
  })
}

export function useFamille(familleId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: familleKeys.detail(familleId ?? ''),
    queryFn: () => getFamille(familleId!),
    enabled: Boolean(familleId) && enabled,
  })
}

export function useFamillesByIds(familleIds: string[]) {
  return useQueries({
    queries: familleIds.map((familleId) => ({
      queryKey: familleKeys.detail(familleId),
      queryFn: () => getFamille(familleId),
      enabled: Boolean(familleId),
    })),
  })
}

function invalidateOrganisation(queryClient: ReturnType<typeof useQueryClient>, personneId?: string) {
  void queryClient.invalidateQueries({ queryKey: familleKeys.all })
  void queryClient.invalidateQueries({ queryKey: ['personnes'] })
  void queryClient.invalidateQueries({ queryKey: ['sprint1'] })
  if (personneId) {
    void queryClient.invalidateQueries({ queryKey: ['personnes', 'familles', personneId] })
  }
}

export function useCreateFamille() {
  const queryClient = useQueryClient()

  return useMutation<FamilleImpact, ApiError, FamilleImpactCreate>({
    mutationFn: createFamille,
    onSuccess: () => invalidateOrganisation(queryClient),
  })
}

export function useUpdateFamille() {
  const queryClient = useQueryClient()

  return useMutation<FamilleImpact, ApiError, { familleId: string; payload: FamilleImpactUpdate }>({
    mutationFn: ({ familleId, payload }) => updateFamille(familleId, payload),
    onSuccess: () => invalidateOrganisation(queryClient),
  })
}

export function useDeleteFamille() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: deleteFamille,
    onSuccess: () => invalidateOrganisation(queryClient),
  })
}

export function useAssignPersonneFamille() {
  const queryClient = useQueryClient()

  return useMutation<
    AffectationFamille,
    ApiError,
    { personneId: string; payload: AffectationFamilleCreate }
  >({
    mutationFn: ({ personneId, payload }) => assignPersonneFamille(personneId, payload),
    onSuccess: (_data, variables) => invalidateOrganisation(queryClient, variables.personneId),
  })
}

export function useUnassignPersonneFamille() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, { personneId: string; familleId: string }>({
    mutationFn: ({ personneId, familleId }) => unassignPersonneFamille(personneId, familleId),
    onSuccess: (_data, variables) => invalidateOrganisation(queryClient, variables.personneId),
  })
}
