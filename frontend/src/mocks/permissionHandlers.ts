import type {
  Permission,
  PermissionCreate,
  PermissionPage,
  PermissionUpdate,
} from '@/types'
import { PERMISSIONS } from '@/lib/permissions'
import { permissionSearchHaystack } from '@/features/permissions/labels'
import { canReadRoles, refreshAccountsHoldingPermission } from './access'
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

const PERMISSION_CODE_PATTERN = /^[a-z][a-z0-9_-]*\.[a-z][a-z0-9_-]*$/

function paginate(items: Permission[], page: number, limit: number): PermissionPage {
  const total = items.length
  const start = (page - 1) * limit
  return {
    data: items.slice(start, start + limit),
    pagination: { page, limit, total },
  }
}

export const permissionHandlers = [
  http.get(apiUrl('permissions'), async ({ request }) => {
    await delay(150)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /permissions', result.reason)
    if (!canReadRoles(result.account)) return forbidden()

    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20) || 20))
    const q = url.searchParams.get('q')?.trim().toLowerCase()
    const moduleFilter = url.searchParams.get('module')?.trim().toLowerCase()

    const filtered = mockDb.permissions.filter((permission) => {
      if (moduleFilter && permission.module.toLowerCase() !== moduleFilter) return false
      if (!q) return true
      return permissionSearchHaystack(permission).includes(q)
    })

    return HttpResponse.json(paginate(filtered, page, limit), { status: 200 })
  }),

  http.post(apiUrl('permissions'), async ({ request }) => {
    await delay(250)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('POST /permissions', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.ROLES_MANAGE)) return forbidden()

    const payload = (await request.json()) as Partial<PermissionCreate>
    const code = payload.code?.trim().toLowerCase()
    const module = payload.module?.trim().toLowerCase()
    const action = payload.action?.trim().toLowerCase()

    if (!code || !module || !action) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
        { field: !code ? 'code' : !module ? 'module' : 'action', rule: 'required' },
      ])
    }

    if (!PERMISSION_CODE_PATTERN.test(code)) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
        { field: 'code', rule: 'pattern' },
      ])
    }

    if (mockDb.permissions.some((permission) => permission.code === code)) {
      return errorResponse(409, 'CONFLICT', 'Une permission porte déjà ce code.')
    }

    const created: Permission = {
      idPermission: crypto.randomUUID(),
      code,
      module,
      action,
      description: payload.description?.trim() || undefined,
      actif: payload.actif ?? true,
    }

    mockDb.permissions.unshift(created)
    appendAuditLog({
      idCompte: result.account.utilisateur.compte.idCompte,
      action: 'PERMISSION_CREATED',
      entiteType: 'permission',
      idEntite: created.idPermission,
    })
    return HttpResponse.json(created, { status: 201 })
  }),

  http.get(apiUrl('permissions/:permissionId'), async ({ params, request }) => {
    await delay(150)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /permissions/:id', result.reason)
    if (!canReadRoles(result.account)) return forbidden()

    const permission = mockDb.permissions.find(
      (candidate) => candidate.idPermission === params.permissionId,
    )
    if (!permission) return errorResponse(404, 'NOT_FOUND', 'Permission introuvable.')

    return HttpResponse.json(permission, { status: 200 })
  }),

  http.patch(apiUrl('permissions/:permissionId'), async ({ params, request }) => {
    await delay(250)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('PATCH /permissions/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.ROLES_MANAGE)) return forbidden()

    const permission = mockDb.permissions.find(
      (candidate) => candidate.idPermission === params.permissionId,
    )
    if (!permission) return errorResponse(404, 'NOT_FOUND', 'Permission introuvable.')

    const payload = (await request.json()) as PermissionUpdate
    if (Object.keys(payload).length === 0) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.')
    }

    if (payload.code) {
      const code = payload.code.trim().toLowerCase()
      if (!PERMISSION_CODE_PATTERN.test(code)) {
        return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
          { field: 'code', rule: 'pattern' },
        ])
      }
      const taken = mockDb.permissions.some(
        (candidate) =>
          candidate.idPermission !== permission.idPermission && candidate.code === code,
      )
      if (taken) return errorResponse(409, 'CONFLICT', 'Une permission porte déjà ce code.')
      permission.code = code
    }

    if (payload.module !== undefined) permission.module = payload.module.trim().toLowerCase()
    if (payload.action !== undefined) permission.action = payload.action.trim().toLowerCase()
    if (payload.description !== undefined) {
      permission.description = payload.description.trim() || undefined
    }
    if (payload.actif !== undefined) permission.actif = payload.actif

    appendAuditLog({
      idCompte: result.account.utilisateur.compte.idCompte,
      action: 'PERMISSION_UPDATED',
      entiteType: 'permission',
      idEntite: permission.idPermission,
    })

    refreshAccountsHoldingPermission(permission.idPermission)
    return HttpResponse.json(permission, { status: 200 })
  }),

  http.delete(apiUrl('permissions/:permissionId'), async ({ params, request }) => {
    await delay(200)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('DELETE /permissions/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.ROLES_MANAGE)) return forbidden()

    const index = mockDb.permissions.findIndex(
      (candidate) => candidate.idPermission === params.permissionId,
    )
    if (index < 0) return errorResponse(404, 'NOT_FOUND', 'Permission introuvable.')

    const permission = mockDb.permissions[index]
    if (
      permission &&
      mockDb.rolePermissions.some((link) => link.idPermission === permission.idPermission)
    ) {
      return errorResponse(
        409,
        'CONFLICT',
        "Cette permission ne peut pas être supprimée tant qu'elle est attribuée à un rôle.",
      )
    }

    mockDb.permissions.splice(index, 1)
    appendAuditLog({
      idCompte: result.account.utilisateur.compte.idCompte,
      action: 'PERMISSION_DELETED',
      entiteType: 'permission',
      idEntite: String(params.permissionId),
    })
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(apiUrl('permissions/:permissionId/roles'), async ({ params, request }) => {
    await delay(150)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /permissions/:id/roles', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.ROLES_MANAGE)) return forbidden()

    const permission = mockDb.permissions.find(
      (candidate) => candidate.idPermission === params.permissionId,
    )
    if (!permission) return errorResponse(404, 'NOT_FOUND', 'Permission introuvable.')

    const roleIds = new Set(
      mockDb.rolePermissions
        .filter((link) => link.idPermission === permission.idPermission)
        .map((link) => link.idRole),
    )
    const roles = mockDb.roles
      .filter((role) => roleIds.has(role.idRole))
      .sort((left, right) => left.nom.localeCompare(right.nom, 'fr'))

    return HttpResponse.json(roles, { status: 200 })
  }),

  http.get(apiUrl('permissions/:permissionId/comptes'), async ({ params, request }) => {
    await delay(150)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /permissions/:id/comptes', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.ROLES_MANAGE)) return forbidden()

    const permission = mockDb.permissions.find(
      (candidate) => candidate.idPermission === params.permissionId,
    )
    if (!permission) return errorResponse(404, 'NOT_FOUND', 'Permission introuvable.')

    const grantingRoleIds = new Set(
      mockDb.rolePermissions
        .filter((link) => link.idPermission === permission.idPermission)
        .map((link) => link.idRole),
    )
    const compteIds = new Set(
      mockDb.affectationsRole
        .filter((affectation) => affectation.actif && grantingRoleIds.has(affectation.idRole))
        .map((affectation) => affectation.idCompte),
    )

    const titulaires = [...compteIds]
      .map((idCompte) => {
        const compte = mockDb.comptes.find((candidate) => candidate.idCompte === idCompte)
        const personne = mockDb.personnes.find(
          (candidate) => candidate.idPersonne === compte?.idPersonne,
        )
        if (!compte || !personne) return null
        const idRoles = mockDb.affectationsRole
          .filter((affectation) => affectation.idCompte === idCompte && affectation.actif)
          .map((affectation) => affectation.idRole)
        return {
          idCompte: compte.idCompte,
          email: compte.email,
          statut: compte.statut,
          idPersonne: personne.idPersonne,
          nom: personne.nom,
          prenom: personne.prenom,
          idRoles,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((left, right) =>
        `${left.prenom} ${left.nom}`.localeCompare(`${right.prenom} ${right.nom}`, 'fr'),
      )

    return HttpResponse.json(titulaires, { status: 200 })
  }),
]
