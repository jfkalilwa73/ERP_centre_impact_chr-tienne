import { describe, expect, it } from 'vitest'
import { contientJeuDemonstration, dumpPilotage, shouldSyncPilotage, type PilotageSnapshot } from './sync'

describe('pilotage local', () => {
  it('retrouve les activités, projets et décisions de démonstration', () => {
    const dump = dumpPilotage()

    expect(shouldSyncPilotage()).toBe(false)
    expect(dump.projets?.some((item) => item.code === 'PROJ-LOU-01')).toBe(true)
    expect(dump.decisions?.some((item) => item.reference === 'DGE-2026-04')).toBe(true)
    expect(dump.objectifs?.['d4f6b8c0-0006-4000-8000-000000000002']?.[0]?.libelle).toBe(
      'Préparer 12 cultes du trimestre',
    )
    expect(Object.keys(dump.activites ?? {}).length).toBeGreaterThan(0)
    expect(Object.keys(dump.budget?.enveloppes ?? {}).length).toBeGreaterThan(0)
  })

  it('reconnaît le jeu d’exemple qui fabriquait les notifications', () => {
    expect(
      contientJeuDemonstration({
        activites: { louange: [{ id: 'act-louange-culte' }] },
      } as unknown as PilotageSnapshot),
    ).toBe(true)
    expect(contientJeuDemonstration({ circulations: [], meta: { seeded: true } })).toBe(false)
  })
})
