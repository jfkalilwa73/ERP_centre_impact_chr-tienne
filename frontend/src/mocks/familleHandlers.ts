import type {
  FamilleImpact,
  FamilleImpactCreate,
  FamilleImpactPage,
  FamilleImpactUpdate,
} from '@/types'
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

function toFamille(record: FamilleImpact): FamilleImpact {
  return {
    idFamille: record.idFamille,
    code: record.code,
    nom: record.nom,
    zone: record.zone,
    description: record.description,
    actif: record.actif,
    dateCreation: record.dateCreation,
  }
}

function paginate(items: FamilleImpact[], page: number, limit: number): FamilleImpactPage {
  const total = items.length
  const start = (page - 1) * limit
  return {
    data: items.slice(start, start + limit),
    pagination: { page, limit, total },
  }
}

export const familleHandlers = [
  http.get(apiUrl('familles-impact'), async ({ request }) => {
    await delay(200)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /familles-impact', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.FAMILLES_READ)) return forbidden()

    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20) || 20))
    const q = url.searchParams.get('q')?.trim().toLowerCase()

    const filtered = mockDb.familles.filter((famille) => {
      if (!q) return true
      return [famille.code, famille.nom, famille.zone, famille.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q))
    })

    return HttpResponse.json(paginate(filtered.map(toFamille), page, limit), { status: 200 })
  }),

  http.post(apiUrl('familles-impact'), async ({ request }) => {
    await delay(300)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('POST /familles-impact', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.FAMILLES_CREATE)) return forbidden()

    const payload = (await request.json()) as Partial<FamilleImpactCreate>
    const code = payload.code?.trim()
    const nom = payload.nom?.trim()

    if (!code || !nom) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
        { field: !code ? 'code' : 'nom', rule: 'required' },
      ])
    }

    const taken = mockDb.familles.some(
      (famille) => famille.code.toLowerCase() === code.toLowerCase(),
    )
    if (taken) {
      return errorResponse(409, 'CONFLICT', 'Une famille d’impact porte déjà ce code.')
    }

    const created: FamilleImpact = {
      idFamille: crypto.randomUUID(),
      code,
      nom,
      zone: payload.zone?.trim() || undefined,
      description: payload.description?.trim() || undefined,
      actif: payload.actif ?? true,
      dateCreation: new Date().toISOString(),
    }

    mockDb.familles.unshift(created)
    return HttpResponse.json(toFamille(created), { status: 201 })
  }),

  http.get(apiUrl('familles-impact/:familleId'), async ({ params, request }) => {
    await delay(150)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /familles-impact/:id', result.reason)

    const famille = mockDb.familles.find((candidate) => candidate.idFamille === params.familleId)
    if (!famille) return errorResponse(404, 'NOT_FOUND', 'Famille d’impact introuvable.')

    return HttpResponse.json(toFamille(famille), { status: 200 })
  }),

  http.patch(apiUrl('familles-impact/:familleId'), async ({ params, request }) => {
    await delay(250)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('PATCH /familles-impact/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.FAMILLES_UPDATE)) return forbidden()

    const famille = mockDb.familles.find((candidate) => candidate.idFamille === params.familleId)
    if (!famille) return errorResponse(404, 'NOT_FOUND', 'Famille d’impact introuvable.')

    const payload = (await request.json()) as FamilleImpactUpdate
    if (Object.keys(payload).length === 0) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.')
    }

    const nextCode = payload.code?.trim() ?? famille.code
    const taken = mockDb.familles.some(
      (candidate) =>
        candidate.idFamille !== famille.idFamille &&
        candidate.code.toLowerCase() === nextCode.toLowerCase(),
    )
    if (taken) {
      return errorResponse(409, 'CONFLICT', 'Une famille d’impact porte déjà ce code.')
    }

    Object.assign(famille, {
      ...(payload.code !== undefined ? { code: payload.code.trim() } : {}),
      ...(payload.nom !== undefined ? { nom: payload.nom.trim() } : {}),
      ...(payload.zone !== undefined ? { zone: payload.zone.trim() || undefined } : {}),
      ...(payload.description !== undefined
        ? { description: payload.description.trim() || undefined }
        : {}),
      ...(payload.actif !== undefined ? { actif: payload.actif } : {}),
    })

    return HttpResponse.json(toFamille(famille), { status: 200 })
  }),

  http.delete(apiUrl('familles-impact/:familleId'), async ({ params, request }) => {
    await delay(200)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('DELETE /familles-impact/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.FAMILLES_DELETE)) return forbidden()

    const index = mockDb.familles.findIndex((candidate) => candidate.idFamille === params.familleId)
    if (index < 0) return errorResponse(404, 'NOT_FOUND', 'Famille d’impact introuvable.')

    const famille = mockDb.familles[index]
    if (
      famille &&
      mockDb.affectationsFamille.some(
        (affectation) => affectation.idFamille === famille.idFamille && affectation.actif,
      )
    ) {
      return errorResponse(
        409,
        'CONFLICT',
        'Cette famille ne peut pas être supprimée tant que des personnes y sont affectées.',
      )
    }

    mockDb.familles.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
