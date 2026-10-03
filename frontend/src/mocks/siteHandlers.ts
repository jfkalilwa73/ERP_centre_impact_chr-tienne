import type { Site, SiteCreate, SitePage, SiteUpdate } from '@/types'
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

function toSite(record: (typeof mockDb.sites)[number]): Site {
  return {
    idSite: record.idSite,
    code: record.code,
    nom: record.nom,
    telephone: record.telephone,
    adresse: record.adresse,
    ville: record.ville,
    pays: record.pays,
    actif: record.actif,
    dateCreation: record.dateCreation,
  }
}

function paginate(items: Site[], page: number, limit: number): SitePage {
  const total = items.length
  const start = (page - 1) * limit
  return {
    data: items.slice(start, start + limit),
    pagination: { page, limit, total },
  }
}

export const siteHandlers = [
  http.get(apiUrl('sites'), async ({ request }) => {
    await delay(200)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /sites', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.SITES_READ)) return forbidden()

    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20) || 20))
    const q = url.searchParams.get('q')?.trim().toLowerCase()

    const filtered = mockDb.sites.filter((site) => {
      if (!q) return true
      return [site.code, site.nom, site.ville, site.pays, site.adresse, site.telephone]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q))
    })

    return HttpResponse.json(paginate(filtered.map(toSite), page, limit), { status: 200 })
  }),

  http.post(apiUrl('sites'), async ({ request }) => {
    await delay(300)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('POST /sites', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.SITES_CREATE)) return forbidden()

    const payload = (await request.json()) as Partial<SiteCreate>
    const code = payload.code?.trim()
    const nom = payload.nom?.trim()
    const telephone = payload.telephone?.trim()

    if (!code || !nom || !telephone) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
        { field: !code ? 'code' : !nom ? 'nom' : 'telephone', rule: 'required' },
      ])
    }

    if (mockDb.sites.some((site) => site.code.toLowerCase() === code.toLowerCase())) {
      return errorResponse(409, 'CONFLICT', 'Un site porte déjà ce code.')
    }

    const created = {
      idSite: crypto.randomUUID(),
      code,
      nom,
      telephone,
      adresse: payload.adresse?.trim() || undefined,
      ville: payload.ville?.trim() || undefined,
      pays: payload.pays?.trim() || undefined,
      actif: payload.actif ?? true,
      dateCreation: new Date().toISOString(),
    }

    mockDb.sites.unshift(created)
    return HttpResponse.json(toSite(created), { status: 201 })
  }),

  http.get(apiUrl('sites/:siteId'), async ({ params, request }) => {
    await delay(150)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /sites/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.SITES_READ)) return forbidden()

    const site = mockDb.sites.find((candidate) => candidate.idSite === params.siteId)
    if (!site) return errorResponse(404, 'NOT_FOUND', 'Site introuvable.')

    return HttpResponse.json(toSite(site), { status: 200 })
  }),

  http.patch(apiUrl('sites/:siteId'), async ({ params, request }) => {
    await delay(250)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('PATCH /sites/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.SITES_UPDATE)) return forbidden()

    const site = mockDb.sites.find((candidate) => candidate.idSite === params.siteId)
    if (!site) return errorResponse(404, 'NOT_FOUND', 'Site introuvable.')

    const payload = (await request.json()) as SiteUpdate
    if (Object.keys(payload).length === 0) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.')
    }

    if (payload.code) {
      const taken = mockDb.sites.some(
        (candidate) =>
          candidate.idSite !== site.idSite &&
          candidate.code.toLowerCase() === payload.code!.toLowerCase(),
      )
      if (taken) return errorResponse(409, 'CONFLICT', 'Un site porte déjà ce code.')
    }

    Object.assign(site, {
      ...(payload.code !== undefined ? { code: payload.code.trim() } : {}),
      ...(payload.nom !== undefined ? { nom: payload.nom.trim() } : {}),
      ...(payload.telephone !== undefined ? { telephone: payload.telephone.trim() } : {}),
      ...(payload.adresse !== undefined ? { adresse: payload.adresse.trim() || undefined } : {}),
      ...(payload.ville !== undefined ? { ville: payload.ville.trim() || undefined } : {}),
      ...(payload.pays !== undefined ? { pays: payload.pays.trim() || undefined } : {}),
      ...(payload.actif !== undefined ? { actif: payload.actif } : {}),
    })

    return HttpResponse.json(toSite(site), { status: 200 })
  }),

  http.delete(apiUrl('sites/:siteId'), async ({ params, request }) => {
    await delay(200)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('DELETE /sites/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.SITES_DELETE)) return forbidden()

    const index = mockDb.sites.findIndex((candidate) => candidate.idSite === params.siteId)
    if (index < 0) return errorResponse(404, 'NOT_FOUND', 'Site introuvable.')

    const site = mockDb.sites[index]
    if (site && mockDb.departements.some((departement) => departement.idSite === site.idSite)) {
      return errorResponse(
        409,
        'CONFLICT',
        'Ce site ne peut pas être supprimé tant que des départements y sont rattachés.',
      )
    }

    mockDb.sites.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
