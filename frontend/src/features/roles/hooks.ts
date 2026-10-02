import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invalidateCurrentUser } from '@/features/auth/hooks'
import type { ApiError } from '@/lib/apiError'
import type { Permission, Role, RoleCreate, RolePermissionCreate, RoleUpdate } from '@/types'
import {
  assignPermissionToRole,
  createRole,
  deleteRole,
  getRole,
  listRolePermissions,
  listRoles,
  unassignPermissionFromRole,
  updateRole,
  type ListRolesParams,
} from './api'

export const roleKeys = {
  all: ['roles'] as const,
  list: (params: ListRolesParams) => [...roleKeys.all, 'list', params] as const,
  detail: (roleId: string) => [...roleKeys.all, 'detail', roleId] as const,
  permissions: (roleId: string) => [...roleKeys.all, 'permissions', roleId] as const,
}

export function useRoles(params: ListRolesParams, enabled = true) {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: () => listRoles(params),
    enabled,
  })
}

export function useRole(roleId: string | undefined) {
  return useQuery({
    queryKey: roleKeys.detail(roleId ?? ''),
    queryFn: () => getRole(roleId!),
    enabled: Boolean(roleId),
  })
}

export function useRolePermissions(roleId: string | undefined) {
  return useQuery({
    queryKey: roleKeys.permissions(roleId ?? ''),
    queryFn: () => listRolePermissions(roleId!),
    enabled: Boolean(roleId),
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation<Role, ApiError, RoleCreate>({
    mutationFn: createRole,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.all })
      invalidateCurrentUser(queryClient)
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation<Role, ApiError, { roleId: string; payload: RoleUpdate }>({
    mutationFn: ({ roleId, payload }) => updateRole(roleId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.all })
      invalidateCurrentUser(queryClient)
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: deleteRole,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.all })
      invalidateCurrentUser(queryClient)
    },
  })
}

export function useAssignPermission(roleId: string) {
  const queryClient = useQueryClient()

  return useMutation<Permission, ApiError, RolePermissionCreate>({
    mutationFn: (payload) => assignPermissionToRole(roleId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.permissions(roleId) })
      invalidateCurrentUser(queryClient)
    },
  })
}

export function useUnassignPermission(roleId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: (permissionId) => unassignPermissionFromRole(roleId, permissionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.permissions(roleId) })
      invalidateCurrentUser(queryClient)
    },
  })
}
