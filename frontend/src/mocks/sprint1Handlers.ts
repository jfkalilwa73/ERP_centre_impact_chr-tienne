import {
  apiUrl,
  authenticate,
  delay,
  errorResponse,
  http,
  HttpResponse,
  unauthenticated,
} from './http'

async function exigerSession(request: Request, chemin: string) {
  const result = authenticate(request.headers.get('Authorization'))
  if (!result.authenticated) return unauthenticated(chemin, result.reason)
  return null
}

export const sprint1Handlers = [
  http.get(apiUrl('membres'), async ({ request }) => {
    await delay(20)
    const refus = await exigerSession(request, 'GET /membres')
    if (refus) return refus
    return HttpResponse.json({ data: [], pagination: { page: 1, limit: 20, total: 0 } })
  }),

  http.get(apiUrl('personnes/:personneId/membre'), async ({ request }) => {
    await delay(20)
    const refus = await exigerSession(request, 'GET /personnes/:id/membre')
    if (refus) return refus
    return errorResponse(404, 'NOT_FOUND', 'Cette personne n’est pas encore enregistrée comme membre.')
  }),

  http.get(apiUrl('personnes/:personneId/regroupement'), async ({ request }) => {
    await delay(20)
    const refus = await exigerSession(request, 'GET /personnes/:id/regroupement')
    if (refus) return refus
    return errorResponse(404, 'NOT_FOUND', 'Aucun regroupement familial pour cette personne.')
  }),

  http.get(apiUrl('membres/:membreId/historique'), async ({ request }) => {
    await delay(20)
    const refus = await exigerSession(request, 'GET /membres/:id/historique')
    if (refus) return refus
    return HttpResponse.json([])
  }),

  http.post(apiUrl('familles-impact/:familleId/suivi'), async ({ request }) => {
    await delay(20)
    const refus = await exigerSession(request, 'POST /familles-impact/:id/suivi')
    if (refus) return refus
    return HttpResponse.json({ affectations: [] })
  }),

  http.get(apiUrl('familles-impact/:familleId/presences'), async ({ request }) => {
    await delay(20)
    const refus = await exigerSession(request, 'GET /familles-impact/:id/presences')
    if (refus) return refus
    return HttpResponse.json({ affectations: [], presences: [] })
  }),

  http.put(apiUrl('familles-impact/:familleId/presences'), async ({ request }) => {
    await delay(20)
    const refus = await exigerSession(request, 'PUT /familles-impact/:id/presences')
    if (refus) return refus
    return HttpResponse.json({ affectations: [], presences: [] })
  }),
]
