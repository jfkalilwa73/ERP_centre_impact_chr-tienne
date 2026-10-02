import { api } from '@/lib/apiClient'
import type { Permission, Role, RoleCreate, RolePage, RolePermissionCreate, RoleUpdate } from '@/types'

export type ListRolesParams = {
  page?: number
  limit?: number
  q?: string
}

export async function listRoles(params: ListRolesParams = {}): Promise<RolePage> {
  const { data } = await api.get<RolePage>('/roles', { params })
  return data
}

export async function getRole(roleId: string): Promise<Role> {
  const { data } = await api.get<Role>(`/roles/${roleId}`)
  return data
}

export async function createRole(payload: RoleCreate): Promise<Role> {
  const { data } = await api.post<Role>('/roles', payload)
  return data
}

export async function updateRole(roleId: string, payload: RoleUpdate): Promise<Role> {
  const { data } = await api.patch<Role>(`/roles/${roleId}`, payload)
  return data
}

export async function deleteRole(roleId: string): Promise<void> {
  await api.delete(`/roles/${roleId}`)
}

export async function listRolePermissions(roleId: string): Promise<Permission[]> {
  const { data } = await api.get<Permission[]>(`/roles/${roleId}/permissions`)
  return data
}

export async function assignPermissionToRole(
  roleId: string,
  payload: RolePermissionCreate,
): Promise<Permission> {
  const { data } = await api.post<Permission>(`/roles/${roleId}/permissions`, payload)
  return data
}

export async function unassignPermissionFromRole(roleId: string, permissionId: string): Promise<void> {
  await api.delete(`/roles/${roleId}/permissions/${permissionId}`)
}
