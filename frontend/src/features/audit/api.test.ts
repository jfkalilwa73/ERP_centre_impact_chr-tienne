import { describe, expect, it } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import { getAuditLog, listAuditLogs } from './api'

const identifiants = { email: 'admin@eglise.org', motDePasse: 'SecurePass123!' }

async function ouvrirSession(email = identifiants.email, motDePasse = identifiants.motDePasse) {
  const { login } = await import('@/features/auth/api')
  const response = await login({ email, motDePasse })
  useAuthStore.getState().openSession(response)
  return response
}

describe('API audit', () => {
  it('liste les traces paginées, les plus récentes d’abord', async () => {
    await ouvrirSession()

    const page = await listAuditLogs({ page: 1, limit: 20 })

    expect(page.pagination.total).toBeGreaterThanOrEqual(8)
    const first = page.data[0]
    const last = page.data.at(-1)
    expect(first && last && first.dateAction >= last.dateAction).toBe(true)
  })

  it('filtre par type d’entité', async () => {
    await ouvrirSession()

    const page = await listAuditLogs({ entiteType: 'site' })

    expect(page.data.length).toBeGreaterThan(0)
    expect(page.data.every((log) => log.entiteType === 'site')).toBe(true)
  })

  it('filtre par action', async () => {
    await ouvrirSession()

    const page = await listAuditLogs({ action: 'PERSONNE_CREATED' })

    expect(page.data).toHaveLength(1)
    expect(page.data[0]?.action).toBe('PERSONNE_CREATED')
  })

  it('consulte une trace', async () => {
    await ouvrirSession()
    const [log] = (await listAuditLogs({ action: 'PERSONNE_CREATED' })).data
    if (!log) throw new Error('trace PERSONNE_CREATED absente')

    const detail = await getAuditLog(log.idAudit)

    expect(detail.idEntite).toBe(log.idEntite)
    expect(detail.nouvellesValeurs).toMatchObject({ nom: 'KABILA' })
  })

  it('interdit la lecture sans le droit audit.read', async () => {
    await ouvrirSession('accueil@eglise.org', 'Accueil2026!')

    await expect(listAuditLogs()).rejects.toMatchObject({ status: 403 })
  })
})
