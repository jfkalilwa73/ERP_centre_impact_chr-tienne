import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invalidateCurrentUser } from '@/features/auth/hooks'
import { assignRoleToCompte, unassignRoleFromCompte, updateCompte } from '@/features/comptes/api'
import { compteKeys } from '@/features/comptes/hooks'
import {
  assignPermissionToRole,
  unassignPermissionFromRole,
} from '@/features/roles/api'
import { roleKeys } from '@/features/roles/hooks'
import type { ApiError } from '@/lib/apiError'
import type { Compte, CompteUpdate, Permission, PermissionCreate, PermissionUpdate } from '@/types'
import {
  createPermission,
  deletePermission,
  listPermissionRoles,
  listPermissionTitulaires,
  listPermissions,
  updatePermission,
  type ListPermissionsParams,
} from './api'

export const permissionKeys = {
  all: ['permissions'] as const,
  list: (params: ListPermissionsParams) => [...permissionKeys.all, 'list', params] as const,
  roles: (permissionId: string) => [...permissionKeys.all, 'roles', permissionId] as const,
  titulaires: (permissionId: string) => [...permissionKeys.all, 'titulaires', permissionId] as const,
}

function invalidatePermissionAcces(
  queryClient: ReturnType<typeof useQueryClient>,
  permissionId: string,
  compteId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: permissionKeys.all })
  void queryClient.invalidateQueries({ queryKey: permissionKeys.roles(permissionId) })
  void queryClient.invalidateQueries({ queryKey: permissionKeys.titulaires(permissionId) })
  void queryClient.invalidateQueries({ queryKey: roleKeys.all })
  void queryClient.invalidateQueries({ queryKey: compteKeys.all })
  invalidateCurrentUser(queryClient)
  if (compteId) {
    void queryClient.invalidateQueries({ queryKey: compteKeys.detail(compteId) })
    void queryClient.invalidateQueries({ queryKey: compteKeys.roles(compteId) })
  }
}

export function usePermissions(params: ListPermissionsParams, enabled = true) {
  return useQuery({
    queryKey: permissionKeys.list(params),
    queryFn: () => listPermissions(params),
    enabled,
  })
}

export function useCreatePermission() {
  const queryClient = useQueryClient()

  return useMutation<Permission, ApiError, PermissionCreate>({
    mutationFn: createPermission,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: permissionKeys.all })
      invalidateCurrentUser(queryClient)
    },
  })
}

export function useUpdatePermission() {
  const queryClient = useQueryClient()

  return useMutation<Permission, ApiError, { permissionId: string; payload: PermissionUpdate }>({
    mutationFn: ({ permissionId, payload }) => updatePermission(permissionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: permissionKeys.all })
      invalidateCurrentUser(queryClient)
    },
  })
}

export function useDeletePermission() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: deletePermission,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: permissionKeys.all })
      invalidateCurrentUser(queryClient)
    },
  })
}

export function usePermissionRoles(permissionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: permissionKeys.roles(permissionId ?? ''),
    queryFn: () => listPermissionRoles(permissionId!),
    enabled: Boolean(permissionId) && enabled,
  })
}

export function usePermissionTitulaires(permissionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: permissionKeys.titulaires(permissionId ?? ''),
    queryFn: () => listPermissionTitulaires(permissionId!),
    enabled: Boolean(permissionId) && enabled,
  })
}

export function useGrantPermissionToRole(permissionId: string) {
  const queryClient = useQueryClient()

  return useMutation<Permission, ApiError, { roleId: string }>({
    mutationFn: ({ roleId }) => assignPermissionToRole(roleId, { idPermission: permissionId }),
    onSuccess: () => invalidatePermissionAcces(queryClient, permissionId),
  })
}

export function useRevokePermissionFromRole(permissionId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, { roleId: string }>({
    mutationFn: ({ roleId }) => unassignPermissionFromRole(roleId, permissionId),
    onSuccess: () => invalidatePermissionAcces(queryClient, permissionId),
  })
}

export function useAssignTitulaireRole(permissionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ compteId, idRole }: { compteId: string; idRole: string }) =>
      assignRoleToCompte(compteId, { idRole }),
    onSuccess: (_data, variables) =>
      invalidatePermissionAcces(queryClient, permissionId, variables.compteId),
  })
}

export function useUnassignTitulaireRole(permissionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ compteId, idRole }: { compteId: string; idRole: string }) =>
      unassignRoleFromCompte(compteId, idRole),
    onSuccess: (_data, variables) =>
      invalidatePermissionAcces(queryClient, permissionId, variables.compteId),
  })
}

export function useUpdateTitulaireCompte(permissionId: string) {
  const queryClient = useQueryClient()

  return useMutation<Compte, ApiError, { compteId: string; payload: CompteUpdate }>({
    mutationFn: ({ compteId, payload }) => updateCompte(compteId, payload),
    onSuccess: (_data, variables) =>
      invalidatePermissionAcces(queryClient, permissionId, variables.compteId),
  })
}
