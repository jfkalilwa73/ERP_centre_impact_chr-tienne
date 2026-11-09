import {
  apiUrl,
  authenticate,
  delay,
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
