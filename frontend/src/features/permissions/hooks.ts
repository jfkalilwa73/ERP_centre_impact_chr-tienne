import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/lib/apiError'
import type { Permission, PermissionCreate, PermissionUpdate } from '@/types'
import {
  createPermission,
  deletePermission,
  listPermissions,
  updatePermission,
  type ListPermissionsParams,
} from './api'

export const permissionKeys = {
  all: ['permissions'] as const,
  list: (params: ListPermissionsParams) => [...permissionKeys.all, 'list', params] as const,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: permissionKeys.all }),
  })
}

export function useUpdatePermission() {
  const queryClient = useQueryClient()

  return useMutation<Permission, ApiError, { permissionId: string; payload: PermissionUpdate }>({
    mutationFn: ({ permissionId, payload }) => updatePermission(permissionId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: permissionKeys.all }),
  })
}

export function useDeletePermission() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: deletePermission,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: permissionKeys.all }),
  })
}
