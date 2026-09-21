import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/lib/apiError'
import type {
  AffectationRole,
  AffectationRoleCreate,
  Compte,
  CompteCreate,
  CompteUpdate,
} from '@/types'
import {
  assignRoleToCompte,
  createCompte,
  deleteCompte,
  getCompte,
  listComptes,
  listCompteRoles,
  unassignRoleFromCompte,
  updateCompte,
  type ListComptesParams,
} from './api'

export const compteKeys = {
  all: ['comptes'] as const,
  list: (params: ListComptesParams) => [...compteKeys.all, 'list', params] as const,
  detail: (id: string) => [...compteKeys.all, 'detail', id] as const,
  roles: (id: string) => [...compteKeys.all, 'roles', id] as const,
}

export function useComptes(params: ListComptesParams, enabled = true) {
  return useQuery({
    queryKey: compteKeys.list(params),
    queryFn: () => listComptes(params),
    enabled,
  })
}

export function useCompte(compteId: string | undefined) {
  return useQuery({
    queryKey: compteKeys.detail(compteId ?? ''),
    queryFn: () => getCompte(compteId!),
    enabled: Boolean(compteId),
  })
}

export function useCompteRoles(compteId: string | undefined) {
  return useQuery({
    queryKey: compteKeys.roles(compteId ?? ''),
    queryFn: () => listCompteRoles(compteId!),
    enabled: Boolean(compteId),
  })
}

function invalidateComptes(queryClient: ReturnType<typeof useQueryClient>, compteId?: string) {
  void queryClient.invalidateQueries({ queryKey: compteKeys.all })
  if (compteId) {
    void queryClient.invalidateQueries({ queryKey: compteKeys.detail(compteId) })
    void queryClient.invalidateQueries({ queryKey: compteKeys.roles(compteId) })
  }
}

export function useCreateCompte() {
  const queryClient = useQueryClient()

  return useMutation<Compte, ApiError, CompteCreate>({
    mutationFn: createCompte,
    onSuccess: () => invalidateComptes(queryClient),
  })
}

export function useUpdateCompte() {
  const queryClient = useQueryClient()

  return useMutation<Compte, ApiError, { compteId: string; payload: CompteUpdate }>({
    mutationFn: ({ compteId, payload }) => updateCompte(compteId, payload),
    onSuccess: (_data, variables) => invalidateComptes(queryClient, variables.compteId),
  })
}

export function useDeleteCompte() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: deleteCompte,
    onSuccess: () => invalidateComptes(queryClient),
  })
}

export function useAssignRole(compteId: string) {
  const queryClient = useQueryClient()

  return useMutation<AffectationRole, ApiError, AffectationRoleCreate>({
    mutationFn: (payload) => assignRoleToCompte(compteId, payload),
    onSuccess: () => invalidateComptes(queryClient, compteId),
  })
}

export function useUnassignRole(compteId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: (roleId) => unassignRoleFromCompte(compteId, roleId),
    onSuccess: () => invalidateComptes(queryClient, compteId),
  })
}
