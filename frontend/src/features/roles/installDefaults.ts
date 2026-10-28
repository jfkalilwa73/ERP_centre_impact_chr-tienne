import { seedPermissions, seedRolePermissions, seedRoles } from '@/mocks/rbac'
import { createPermission, listPermissions } from '@/features/permissions/api'
import type { Permission, Role } from '@/types'
import { assignPermissionToRole, createRole, listRolePermissions, listRoles } from './api'

export type InstallDefaultRolesResult = {
  rolesCreated: number
  permissionsCreated: number
  rolePermissionsAdded: number
}

async function allRoles() {
  const roles: Role[] = []
  for (let page = 1; ; page += 1) {
    const result = await listRoles({ page, limit: 100 })
    roles.push(...result.data)
    if (!result.data.length || roles.length >= result.pagination.total) return roles
  }
}

async function allPermissions() {
  const permissions: Permission[] = []
  for (let page = 1; ; page += 1) {
    const result = await listPermissions({ page, limit: 100 })
    permissions.push(...result.data)
    if (!result.data.length || permissions.length >= result.pagination.total) return permissions
  }
}

/** Creates or completes the built-in role profiles without removing custom grants. */
export async function installDefaultRoles(): Promise<InstallDefaultRolesResult> {
  const [roles, permissions] = await Promise.all([allRoles(), allPermissions()])
  const permissionsByCode = new Map(permissions.map((permission) => [permission.code, permission]))
  const seedPermissionById = new Map(seedPermissions.map((permission) => [permission.idPermission, permission]))
  let permissionsCreated = 0
  const rolesByCode = new Map(roles.map((role) => [role.code, role]))
  let rolesCreated = 0
  let rolePermissionsAdded = 0

  for (const template of seedPermissions) {
    if (permissionsByCode.has(template.code)) continue
    const permission = await createPermission({
      code: template.code,
      module: template.module,
      action: template.action,
      description: template.description,
      actif: template.actif,
    })
    permissionsByCode.set(permission.code, permission)
    permissionsCreated += 1
  }

  for (const template of seedRoles) {
    let role = rolesByCode.get(template.code)
    if (!role) {
      role = await createRole({
        code: template.code,
        nom: template.nom,
        description: template.description,
        niveauConfidentialite: template.niveauConfidentialite,
        actif: template.actif,
      })
      rolesByCode.set(role.code, role)
      rolesCreated += 1
    }

    const assigned = await listRolePermissions(role.idRole)
    const assignedCodes = new Set(assigned.map((permission) => permission.code))
    const desiredCodes = seedRolePermissions
      .filter((link) => link.idRole === template.idRole)
      .map((link) => seedPermissionById.get(link.idPermission)?.code)
      .filter((code): code is string => Boolean(code))

    for (const code of desiredCodes) {
      if (assignedCodes.has(code)) continue
      const permission = permissionsByCode.get(code)
      if (!permission) continue
      await assignPermissionToRole(role.idRole, { idPermission: permission.idPermission })
      assignedCodes.add(code)
      rolePermissionsAdded += 1
    }
  }

  return { rolesCreated, permissionsCreated, rolePermissionsAdded }
}
