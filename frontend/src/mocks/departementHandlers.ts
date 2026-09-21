import type { Departement, DepartementCreate, DepartementPage, DepartementUpdate } from '@/types'
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

function toDepartement(record: (typeof mockDb.departements)[number]): Departement {
  return {
    idDepartement: record.idDepartement,
    code: record.code,
    nom: record.nom,
    mission: record.mission,
    idSite: record.idSite,
    actif: record.actif,
    dateCreation: record.dateCreation,
  }
}

function paginate(items: Departement[], page: number, limit: number): DepartementPage {
  const total = items.length
  const start = (page - 1) * limit
  return {
    data: items.slice(start, start + limit),
    pagination: { page, limit, total },
  }
}

export const departementHandlers = [
  http.get(apiUrl('departements'), async ({ request }) => {
    await delay(200)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /departements', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.DEPARTEMENTS_READ)) return forbidden()

    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20) || 20))
    const q = url.searchParams.get('q')?.trim().toLowerCase()
    const siteId = url.searchParams.get('siteId')?.trim()

    const filtered = mockDb.departements.filter((departement) => {
      if (siteId && departement.idSite !== siteId) return false
      if (!q) return true
      return [departement.code, departement.nom, departement.mission]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q))
    })

    return HttpResponse.json(paginate(filtered.map(toDepartement), page, limit), { status: 200 })
  }),

  http.post(apiUrl('departements'), async ({ request }) => {
    await delay(300)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('POST /departements', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.DEPARTEMENTS_CREATE)) return forbidden()

    const payload = (await request.json()) as Partial<DepartementCreate>
    const code = payload.code?.trim()
    const nom = payload.nom?.trim()
    const idSite = payload.idSite?.trim()

    if (!code || !nom || !idSite) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
        { field: !code ? 'code' : !nom ? 'nom' : 'idSite', rule: 'required' },
      ])
    }

    if (!mockDb.sites.some((site) => site.idSite === idSite)) {
      return errorResponse(404, 'NOT_FOUND', 'Le site rattaché est introuvable.')
    }

    const taken = mockDb.departements.some(
      (departement) =>
        departement.idSite === idSite && departement.code.toLowerCase() === code.toLowerCase(),
    )
    if (taken) {
      return errorResponse(409, 'CONFLICT', 'Un département porte déjà ce code sur ce site.')
    }

    const created = {
      idDepartement: crypto.randomUUID(),
      code,
      nom,
      idSite,
      mission: payload.mission?.trim() || undefined,
      actif: payload.actif ?? true,
      dateCreation: new Date().toISOString(),
    }

    mockDb.departements.unshift(created)
    return HttpResponse.json(toDepartement(created), { status: 201 })
  }),

  http.get(apiUrl('departements/:departementId'), async ({ params, request }) => {
    await delay(150)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /departements/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.DEPARTEMENTS_READ)) return forbidden()

    const departement = mockDb.departements.find(
      (candidate) => candidate.idDepartement === params.departementId,
    )
    if (!departement) return errorResponse(404, 'NOT_FOUND', 'Département introuvable.')

    return HttpResponse.json(toDepartement(departement), { status: 200 })
  }),

  http.patch(apiUrl('departements/:departementId'), async ({ params, request }) => {
    await delay(250)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('PATCH /departements/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.DEPARTEMENTS_UPDATE)) return forbidden()

    const departement = mockDb.departements.find(
      (candidate) => candidate.idDepartement === params.departementId,
    )
    if (!departement) return errorResponse(404, 'NOT_FOUND', 'Département introuvable.')

    const payload = (await request.json()) as DepartementUpdate
    if (Object.keys(payload).length === 0) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.')
    }

    const nextSiteId = payload.idSite?.trim() ?? departement.idSite
    const nextCode = payload.code?.trim() ?? departement.code

    if (payload.idSite && !mockDb.sites.some((site) => site.idSite === nextSiteId)) {
      return errorResponse(404, 'NOT_FOUND', 'Le site rattaché est introuvable.')
    }

    const taken = mockDb.departements.some(
      (candidate) =>
        candidate.idDepartement !== departement.idDepartement &&
        candidate.idSite === nextSiteId &&
        candidate.code.toLowerCase() === nextCode.toLowerCase(),
    )
    if (taken) {
      return errorResponse(409, 'CONFLICT', 'Un département porte déjà ce code sur ce site.')
    }

    Object.assign(departement, {
      ...(payload.code !== undefined ? { code: payload.code.trim() } : {}),
      ...(payload.nom !== undefined ? { nom: payload.nom.trim() } : {}),
      ...(payload.mission !== undefined ? { mission: payload.mission.trim() || undefined } : {}),
      ...(payload.idSite !== undefined ? { idSite: payload.idSite } : {}),
      ...(payload.actif !== undefined ? { actif: payload.actif } : {}),
    })

    return HttpResponse.json(toDepartement(departement), { status: 200 })
  }),

  http.delete(apiUrl('departements/:departementId'), async ({ params, request }) => {
    await delay(200)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('DELETE /departements/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.DEPARTEMENTS_DELETE)) return forbidden()

    const index = mockDb.departements.findIndex(
      (candidate) => candidate.idDepartement === params.departementId,
    )
    if (index < 0) return errorResponse(404, 'NOT_FOUND', 'Département introuvable.')

    const departement = mockDb.departements[index]
    if (
      departement &&
      mockDb.affectations.some(
        (affectation) => affectation.idDepartement === departement.idDepartement && affectation.actif,
      )
    ) {
      return errorResponse(
        409,
        'CONFLICT',
        'Ce département ne peut pas être supprimé tant que des personnes y sont affectées.',
      )
    }

    mockDb.departements.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
