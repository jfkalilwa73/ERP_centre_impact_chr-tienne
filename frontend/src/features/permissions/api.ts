import { api } from '@/lib/apiClient'
import type { Permission, PermissionCreate, PermissionPage, PermissionUpdate } from '@/types'

export type ListPermissionsParams = {
  page?: number
  limit?: number
  q?: string
  module?: string
}

export async function listPermissions(params: ListPermissionsParams = {}): Promise<PermissionPage> {
  const { data } = await api.get<PermissionPage>('/permissions', { params })
  return data
}

export async function getPermission(permissionId: string): Promise<Permission> {
  const { data } = await api.get<Permission>(`/permissions/${permissionId}`)
  return data
}

export async function createPermission(payload: PermissionCreate): Promise<Permission> {
  const { data } = await api.post<Permission>('/permissions', payload)
  return data
}

export async function updatePermission(
  permissionId: string,
  payload: PermissionUpdate,
): Promise<Permission> {
  const { data } = await api.patch<Permission>(`/permissions/${permissionId}`, payload)
  return data
}

export async function deletePermission(permissionId: string): Promise<void> {
  await api.delete(`/permissions/${permissionId}`)
}
