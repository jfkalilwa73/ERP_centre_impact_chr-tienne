import type { Permission, Role, RoleCreate, RolePage, RoleUpdate } from '@/types'
import { PERMISSIONS } from '@/lib/permissions'
import { canReadRoles } from './access'
import { appendAuditLog, mockDb } from './db'
import {
  apiUrl,
  authenticate,
  delay,
  errorResponse,
  forbidden,
  http,
  HttpResponse,
  requirePermission,
  unauthenticated,
} from './http'

const ROLE_CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/

function paginate(items: Role[], page: number, limit: number): RolePage {
  const total = items.length
  const start = (page - 1) * limit
  return {
    data: items.slice(start, start + limit),
    pagination: { page, limit, total },
  }
}

function permissionsOfRole(roleId: string): Permission[] {
  const assigned = new Set(
    mockDb.rolePermissions
      .filter((link) => link.idRole === roleId)
      .map((link) => link.idPermission),
  )
  return mockDb.permissions.filter((permission) => assigned.has(permission.idPermission))
}

export const roleHandlers = [
  http.get(apiUrl('roles'), async ({ request }) => {
    await delay(150)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /roles', result.reason)
    if (!canReadRoles(result.account)) return forbidden()

    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20) || 20))
    const q = url.searchParams.get('q')?.trim().toLowerCase()

    const filtered = mockDb.roles.filter((role) => {
      if (!q) return true
      return [role.code, role.nom, role.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q))
    })

    return HttpResponse.json(paginate(filtered, page, limit), { status: 200 })
  }),

  http.post(apiUrl('roles'), async ({ request }) => {
    await delay(250)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('POST /roles', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.ROLES_MANAGE)) return forbidden()

    const payload = (await request.json()) as Partial<RoleCreate>
    const code = payload.code?.trim().toUpperCase()
    const nom = payload.nom?.trim()

    if (!code || !nom) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
        { field: !code ? 'code' : 'nom', rule: 'required' },
      ])
    }

    if (!ROLE_CODE_PATTERN.test(code)) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
        { field: 'code', rule: 'pattern' },
      ])
    }

    if (mockDb.roles.some((role) => role.code.toUpperCase() === code)) {
      return errorResponse(409, 'CONFLICT', 'Un rôle porte déjà ce code.')
    }

    const created: Role = {
      idRole: crypto.randomUUID(),
      code,
      nom,
      description: payload.description?.trim() || undefined,
      niveauConfidentialite: payload.niveauConfidentialite ?? 1,
      actif: payload.actif ?? true,
      dateCreation: new Date().toISOString(),
    }

    mockDb.roles.unshift(created)
    appendAuditLog({
      idCompte: result.account.utilisateur.compte.idCompte,
      action: 'ROLE_CREATED',
      entiteType: 'role',
      idEntite: created.idRole,
    })
    return HttpResponse.json(created, { status: 201 })
  }),

  http.get(apiUrl('roles/:roleId'), async ({ params, request }) => {
    await delay(150)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /roles/:id', result.reason)
    if (!canReadRoles(result.account)) return forbidden()

    const role = mockDb.roles.find((candidate) => candidate.idRole === params.roleId)
    if (!role) return errorResponse(404, 'NOT_FOUND', 'Rôle introuvable.')

    return HttpResponse.json(role, { status: 200 })
  }),

  http.patch(apiUrl('roles/:roleId'), async ({ params, request }) => {
    await delay(250)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('PATCH /roles/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.ROLES_MANAGE)) return forbidden()

    const role = mockDb.roles.find((candidate) => candidate.idRole === params.roleId)
    if (!role) return errorResponse(404, 'NOT_FOUND', 'Rôle introuvable.')

    const payload = (await request.json()) as RoleUpdate
    if (Object.keys(payload).length === 0) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.')
    }

    if (payload.code) {
      const code = payload.code.trim().toUpperCase()
      if (!ROLE_CODE_PATTERN.test(code)) {
        return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
          { field: 'code', rule: 'pattern' },
        ])
      }
      const taken = mockDb.roles.some(
        (candidate) => candidate.idRole !== role.idRole && candidate.code.toUpperCase() === code,
      )
      if (taken) return errorResponse(409, 'CONFLICT', 'Un rôle porte déjà ce code.')
      role.code = code
    }

    if (payload.nom !== undefined) role.nom = payload.nom.trim()
    if (payload.description !== undefined) {
      role.description = payload.description.trim() || undefined
    }
    if (payload.niveauConfidentialite !== undefined) {
      role.niveauConfidentialite = payload.niveauConfidentialite
    }
    if (payload.actif !== undefined) role.actif = payload.actif

    appendAuditLog({
      idCompte: result.account.utilisateur.compte.idCompte,
      action: 'ROLE_UPDATED',
      entiteType: 'role',
      idEntite: role.idRole,
    })

    return HttpResponse.json(role, { status: 200 })
  }),

  http.delete(apiUrl('roles/:roleId'), async ({ params, request }) => {
    await delay(200)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('DELETE /roles/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.ROLES_MANAGE)) return forbidden()

    const index = mockDb.roles.findIndex((candidate) => candidate.idRole === params.roleId)
    if (index < 0) return errorResponse(404, 'NOT_FOUND', 'Rôle introuvable.')

    const role = mockDb.roles[index]
    if (
      role &&
      mockDb.affectationsRole.some(
        (affectation) => affectation.idRole === role.idRole && affectation.actif,
      )
    ) {
      return errorResponse(
        409,
        'CONFLICT',
        "Ce rôle ne peut pas être supprimé tant qu'il est attribué à un compte.",
      )
    }

    mockDb.roles.splice(index, 1)
    mockDb.rolePermissions = mockDb.rolePermissions.filter((link) => link.idRole !== params.roleId)
    appendAuditLog({
      idCompte: result.account.utilisateur.compte.idCompte,
      action: 'ROLE_DELETED',
      entiteType: 'role',
      idEntite: String(params.roleId),
    })
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(apiUrl('roles/:roleId/permissions'), async ({ params, request }) => {
    await delay(150)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /roles/:id/permissions', result.reason)
    if (!canReadRoles(result.account)) return forbidden()

    const role = mockDb.roles.find((candidate) => candidate.idRole === params.roleId)
    if (!role) return errorResponse(404, 'NOT_FOUND', 'Rôle introuvable.')

    return HttpResponse.json(permissionsOfRole(String(params.roleId)), { status: 200 })
  }),

  http.post(apiUrl('roles/:roleId/permissions'), async ({ params, request }) => {
    await delay(250)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('POST /roles/:id/permissions', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.ROLES_MANAGE)) return forbidden()

    const role = mockDb.roles.find((candidate) => candidate.idRole === params.roleId)
    if (!role) return errorResponse(404, 'NOT_FOUND', 'Rôle introuvable.')

    const payload = (await request.json()) as { idPermission?: string }
    const idPermission = payload.idPermission?.trim()
    if (!idPermission) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
        { field: 'idPermission', rule: 'required' },
      ])
    }

    const permission = mockDb.permissions.find((candidate) => candidate.idPermission === idPermission)
    if (!permission) return errorResponse(404, 'NOT_FOUND', 'Permission introuvable.')

    const already = mockDb.rolePermissions.some(
      (link) => link.idRole === params.roleId && link.idPermission === idPermission,
    )
    if (already) {
      return errorResponse(409, 'CONFLICT', 'Cette permission est déjà attribuée à ce rôle.')
    }

    mockDb.rolePermissions.unshift({ idRole: String(params.roleId), idPermission })
    appendAuditLog({
      idCompte: result.account.utilisateur.compte.idCompte,
      action: 'PERMISSION_ASSIGNED',
      entiteType: 'role',
      idEntite: String(params.roleId),
    })
    return HttpResponse.json(permission, { status: 201 })
  }),

  http.delete(apiUrl('roles/:roleId/permissions/:permissionId'), async ({ params, request }) => {
    await delay(200)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) {
      return unauthenticated('DELETE /roles/:id/permissions/:id', result.reason)
    }
    if (!requirePermission(result.account, PERMISSIONS.ROLES_MANAGE)) return forbidden()

    const index = mockDb.rolePermissions.findIndex(
      (link) => link.idRole === params.roleId && link.idPermission === params.permissionId,
    )
    if (index < 0) return errorResponse(404, 'NOT_FOUND', 'Attribution introuvable.')

    mockDb.rolePermissions.splice(index, 1)
    appendAuditLog({
      idCompte: result.account.utilisateur.compte.idCompte,
      action: 'PERMISSION_UNASSIGNED',
      entiteType: 'role',
      idEntite: String(params.roleId),
    })
    return new HttpResponse(null, { status: 204 })
  }),
]
