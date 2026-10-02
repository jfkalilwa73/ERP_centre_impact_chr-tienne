import type { AuditLog, AuditLogPage } from '@/types'
import { PERMISSIONS } from '@/lib/permissions'
import { mockDb } from './db'
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

function paginate(items: AuditLog[], page: number, limit: number): AuditLogPage {
  const total = items.length
  const start = (page - 1) * limit
  return {
    data: items.slice(start, start + limit),
    pagination: { page, limit, total },
  }
}

export const auditHandlers = [
  http.get(apiUrl('audit-logs'), async ({ request }) => {
    await delay(150)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /audit-logs', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.AUDIT_READ)) return forbidden()

    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20) || 20))
    const compteId = url.searchParams.get('compteId')?.trim()
    const entiteType = url.searchParams.get('entiteType')?.trim().toLowerCase()
    const entiteId = url.searchParams.get('entiteId')?.trim()
    const action = url.searchParams.get('action')?.trim().toLowerCase()
    const depuis = url.searchParams.get('depuis')
    const jusqua = url.searchParams.get('jusqua')

    const sorted = [...mockDb.auditLogs].sort(
      (left, right) => new Date(right.dateAction).getTime() - new Date(left.dateAction).getTime(),
    )

    const filtered = sorted.filter((log) => {
      if (compteId && log.idCompte !== compteId) return false
      if (entiteType && log.entiteType.toLowerCase() !== entiteType) return false
      if (entiteId && log.idEntite !== entiteId) return false
      if (action && log.action.toLowerCase() !== action) return false
      if (depuis && new Date(log.dateAction) < new Date(depuis)) return false
      if (jusqua && new Date(log.dateAction) > new Date(jusqua)) return false
      return true
    })

    return HttpResponse.json(paginate(filtered, page, limit), { status: 200 })
  }),

  http.get(apiUrl('audit-logs/:auditId'), async ({ params, request }) => {
    await delay(150)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /audit-logs/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.AUDIT_READ)) return forbidden()

    const log = mockDb.auditLogs.find((candidate) => candidate.idAudit === params.auditId)
    if (!log) return errorResponse(404, 'NOT_FOUND', "Trace d'audit introuvable.")

    return HttpResponse.json(log, { status: 200 })
  }),
]
