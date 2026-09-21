import type {
  AffectationDepartement,
  AffectationDepartementCreate,
  Personne,
  PersonneCreate,
  PersonnePage,
  PersonneStatut,
  PersonneUpdate,
} from '@/types'
import { PERMISSIONS } from '@/lib/permissions'
import { isLeadershipRole } from '@/features/departements/roles'
import { mockAccounts, type MockAccount } from './fixtures'
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

function paginate(items: Personne[], page: number, limit: number): PersonnePage {
  const total = items.length
  const start = (page - 1) * limit
  return {
    data: items.slice(start, start + limit),
    pagination: { page, limit, total },
  }
}

function syncAccountPersonne(personne: Personne) {
  const account = mockAccounts.find(
    (candidate) => candidate.utilisateur.compte.idPersonne === personne.idPersonne,
  )
  if (account) account.utilisateur.personne = personne
}

function canManageDepartementMembers(account: MockAccount, departementId: string) {
  if (requirePermission(account, PERMISSIONS.MEMBRES_UPDATE)) return true
  const idPersonne = account.utilisateur.compte.idPersonne
  return mockDb.affectations.some(
    (affectation) =>
      affectation.idPersonne === idPersonne &&
      affectation.idDepartement === departementId &&
      affectation.actif &&
      isLeadershipRole(affectation.fonction),
  )
}

export const personneHandlers = [
  http.get(apiUrl('personnes'), async ({ request }) => {
    await delay(200)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /personnes', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.MEMBRES_READ)) return forbidden()

    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20) || 20))
    const q = url.searchParams.get('q')?.trim().toLowerCase()
    const statut = url.searchParams.get('statut') as PersonneStatut | null

    const filtered = mockDb.personnes.filter((personne) => {
      if (statut && personne.statut !== statut) return false
      if (!q) return true
      return [personne.nom, personne.prenom, personne.telephone, personne.adresse]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q))
    })

    return HttpResponse.json(paginate(filtered, page, limit), { status: 200 })
  }),

  http.post(apiUrl('personnes'), async ({ request }) => {
    await delay(300)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('POST /personnes', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.MEMBRES_CREATE)) return forbidden()

    const payload = (await request.json()) as Partial<PersonneCreate>
    const nom = payload.nom?.trim()
    const prenom = payload.prenom?.trim()

    if (!nom || !prenom) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
        { field: !nom ? 'nom' : 'prenom', rule: 'required' },
      ])
    }

    const telephone = payload.telephone?.trim()
    if (
      telephone &&
      mockDb.personnes.some((personne) => personne.telephone === telephone)
    ) {
      return errorResponse(409, 'CONFLICT', 'Une personne porte déjà ce numéro de téléphone.')
    }

    const now = new Date().toISOString()
    const created: Personne = {
      idPersonne: crypto.randomUUID(),
      nom,
      prenom,
      dateNaissance: payload.dateNaissance || undefined,
      sexe: payload.sexe,
      telephone: telephone || undefined,
      adresse: payload.adresse?.trim() || undefined,
      photoUrl: payload.photoUrl?.trim() || undefined,
      statut: payload.statut ?? 'actif',
      dateCreation: now,
      dateModification: now,
    }

    mockDb.personnes.unshift(created)
    return HttpResponse.json(created, { status: 201 })
  }),

  http.get(apiUrl('personnes/:personneId'), async ({ params, request }) => {
    await delay(150)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('GET /personnes/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.MEMBRES_READ)) return forbidden()

    const personne = mockDb.personnes.find((candidate) => candidate.idPersonne === params.personneId)
    if (!personne) return errorResponse(404, 'NOT_FOUND', 'Personne introuvable.')

    return HttpResponse.json(personne, { status: 200 })
  }),

  http.patch(apiUrl('personnes/:personneId'), async ({ params, request }) => {
    await delay(250)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('PATCH /personnes/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.MEMBRES_UPDATE)) return forbidden()

    const personne = mockDb.personnes.find((candidate) => candidate.idPersonne === params.personneId)
    if (!personne) return errorResponse(404, 'NOT_FOUND', 'Personne introuvable.')

    const payload = (await request.json()) as PersonneUpdate
    if (Object.keys(payload).length === 0) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.')
    }

    if (payload.telephone) {
      const taken = mockDb.personnes.some(
        (candidate) =>
          candidate.idPersonne !== personne.idPersonne && candidate.telephone === payload.telephone,
      )
      if (taken) return errorResponse(409, 'CONFLICT', 'Une personne porte déjà ce numéro de téléphone.')
    }

    Object.assign(personne, {
      ...(payload.nom !== undefined ? { nom: payload.nom.trim() } : {}),
      ...(payload.prenom !== undefined ? { prenom: payload.prenom.trim() } : {}),
      ...(payload.dateNaissance !== undefined ? { dateNaissance: payload.dateNaissance || undefined } : {}),
      ...(payload.sexe !== undefined ? { sexe: payload.sexe } : {}),
      ...(payload.telephone !== undefined ? { telephone: payload.telephone.trim() || undefined } : {}),
      ...(payload.adresse !== undefined ? { adresse: payload.adresse.trim() || undefined } : {}),
      ...(payload.photoUrl !== undefined ? { photoUrl: payload.photoUrl.trim() || undefined } : {}),
      ...(payload.statut !== undefined ? { statut: payload.statut } : {}),
      dateModification: new Date().toISOString(),
    })

    syncAccountPersonne(personne)
    return HttpResponse.json(personne, { status: 200 })
  }),

  http.delete(apiUrl('personnes/:personneId'), async ({ params, request }) => {
    await delay(200)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) return unauthenticated('DELETE /personnes/:id', result.reason)
    if (!requirePermission(result.account, PERMISSIONS.MEMBRES_DELETE)) return forbidden()

    const index = mockDb.personnes.findIndex((candidate) => candidate.idPersonne === params.personneId)
    if (index < 0) return errorResponse(404, 'NOT_FOUND', 'Personne introuvable.')

    const personne = mockDb.personnes[index]
    if (personne?.statut === 'actif') {
      return errorResponse(
        409,
        'CONFLICT',
        'Une personne active ne peut pas être supprimée. Passez-la en inactif ou archivé.',
      )
    }

    mockDb.personnes.splice(index, 1)
    mockDb.affectations = mockDb.affectations.filter(
      (affectation) => affectation.idPersonne !== params.personneId,
    )
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(apiUrl('personnes/:personneId/departements'), async ({ params, request }) => {
    await delay(150)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) {
      return unauthenticated('GET /personnes/:id/departements', result.reason)
    }
    if (!requirePermission(result.account, PERMISSIONS.MEMBRES_READ)) return forbidden()

    const personne = mockDb.personnes.find((candidate) => candidate.idPersonne === params.personneId)
    if (!personne) return errorResponse(404, 'NOT_FOUND', 'Personne introuvable.')

    const url = new URL(request.url)
    const actifParam = url.searchParams.get('actif')
    const affectations = mockDb.affectations.filter((affectation) => {
      if (affectation.idPersonne !== params.personneId) return false
      if (actifParam === 'true') return affectation.actif
      if (actifParam === 'false') return !affectation.actif
      return true
    })

    return HttpResponse.json(affectations, { status: 200 })
  }),

  http.post(apiUrl('personnes/:personneId/departements'), async ({ params, request }) => {
    await delay(250)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) {
      return unauthenticated('POST /personnes/:id/departements', result.reason)
    }
    const payload = (await request.json()) as Partial<AffectationDepartementCreate>
    const idDepartement = payload.idDepartement?.trim()
    if (!idDepartement) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Données non conformes.', [
        { field: 'idDepartement', rule: 'required' },
      ])
    }
    if (!canManageDepartementMembers(result.account, idDepartement)) return forbidden()

    const personne = mockDb.personnes.find((candidate) => candidate.idPersonne === params.personneId)
    if (!personne) return errorResponse(404, 'NOT_FOUND', 'Personne introuvable.')

    const departement = mockDb.departements.find((candidate) => candidate.idDepartement === idDepartement)
    if (!departement) return errorResponse(404, 'NOT_FOUND', 'Département introuvable.')

    const dejaActive = mockDb.affectations.some(
      (affectation) =>
        affectation.idPersonne === params.personneId &&
        affectation.idDepartement === idDepartement &&
        affectation.actif,
    )
    if (dejaActive) {
      return errorResponse(409, 'CONFLICT', 'Cette personne est déjà affectée à ce département.')
    }

    const created: AffectationDepartement = {
      idPersonne: String(params.personneId),
      idDepartement,
      fonction: payload.fonction?.trim() || undefined,
      dateDebut: payload.dateDebut ?? new Date().toISOString(),
      dateFin: payload.dateFin,
      actif: true,
    }

    mockDb.affectations.unshift(created)
    return HttpResponse.json(created, { status: 201 })
  }),

  http.delete(apiUrl('personnes/:personneId/departements/:departementId'), async ({ params, request }) => {
    await delay(200)

    const result = authenticate(request.headers.get('Authorization'))
    if (!result.authenticated) {
      return unauthenticated('DELETE /personnes/:id/departements/:id', result.reason)
    }
    if (!canManageDepartementMembers(result.account, String(params.departementId))) return forbidden()

    const affectation = mockDb.affectations.find(
      (candidate) =>
        candidate.idPersonne === params.personneId &&
        candidate.idDepartement === params.departementId &&
        candidate.actif,
    )
    if (!affectation) return errorResponse(404, 'NOT_FOUND', 'Affectation active introuvable.')

    affectation.actif = false
    affectation.dateFin = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),
]
