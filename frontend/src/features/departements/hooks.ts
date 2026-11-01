import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { assignPersonneDepartement, unassignPersonneDepartement } from '@/features/personnes/api'
import type { ApiError } from '@/lib/apiError'
import type {
  AffectationDepartement,
  AffectationDepartementCreate,
  Departement,
  DepartementCreate,
  DepartementUpdate,
} from '@/types'
import {
  createDepartement,
  deleteDepartement,
  getDepartement,
  listDepartements,
  updateDepartement,
  type ListDepartementsParams,
} from './api'

export const departementKeys = {
  all: ['departements'] as const,
  list: (params: ListDepartementsParams) => [...departementKeys.all, 'list', params] as const,
  detail: (id: string) => [...departementKeys.all, 'detail', id] as const,
}

export function useDepartements(params: ListDepartementsParams, enabled = true) {
  return useQuery({
    queryKey: departementKeys.list(params),
    queryFn: () => listDepartements(params),
    enabled,
  })
}

export function useDepartement(departementId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: departementKeys.detail(departementId ?? ''),
    queryFn: () => getDepartement(departementId!),
    enabled: Boolean(departementId) && enabled,
  })
}

export function useDepartementsByIds(departementIds: string[]) {
  return useQueries({
    queries: departementIds.map((departementId) => ({
      queryKey: departementKeys.detail(departementId),
      queryFn: () => getDepartement(departementId),
      enabled: Boolean(departementId),
    })),
  })
}

function invalidateOrganisation(queryClient: ReturnType<typeof useQueryClient>, personneId?: string) {
  void queryClient.invalidateQueries({ queryKey: departementKeys.all })
  void queryClient.invalidateQueries({ queryKey: ['personnes'] })
  if (personneId) {
    void queryClient.invalidateQueries({ queryKey: ['personnes', 'affectations', personneId] })
  }
}

export function useCreateDepartement() {
  const queryClient = useQueryClient()

  return useMutation<Departement, ApiError, DepartementCreate>({
    mutationFn: createDepartement,
    onSuccess: () => invalidateOrganisation(queryClient),
  })
}

export function useUpdateDepartement() {
  const queryClient = useQueryClient()

  return useMutation<Departement, ApiError, { departementId: string; payload: DepartementUpdate }>({
    mutationFn: ({ departementId, payload }) => updateDepartement(departementId, payload),
    onSuccess: () => invalidateOrganisation(queryClient),
  })
}

export function useDeleteDepartement() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: deleteDepartement,
    onSuccess: () => invalidateOrganisation(queryClient),
  })
}

export function useAssignPersonneDepartement() {
  const queryClient = useQueryClient()

  return useMutation<
    AffectationDepartement,
    ApiError,
    { personneId: string; payload: AffectationDepartementCreate }
  >({
    mutationFn: ({ personneId, payload }) => assignPersonneDepartement(personneId, payload),
    onSuccess: (_data, variables) => invalidateOrganisation(queryClient, variables.personneId),
  })
}

export function useUnassignPersonneDepartement() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, { personneId: string; departementId: string }>({
    mutationFn: ({ personneId, departementId }) =>
      unassignPersonneDepartement(personneId, departementId),
    onSuccess: (_data, variables) => invalidateOrganisation(queryClient, variables.personneId),
  })
}
