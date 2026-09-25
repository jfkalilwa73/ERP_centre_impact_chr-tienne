import { describe, expect, it } from 'vitest'
import { resetActivites } from '@/features/departements/activites'
import { resetBudget } from '@/features/departements/budget'
import { syncAlertes } from './alertes'
import { deleteCirculation, listCirculations, resetCirculations } from './circulation'

describe('alertes', () => {
  it('place les échéances et le budget en attente dans la circulation', () => {
    resetActivites()
    resetBudget()
    resetCirculations()
    syncAlertes()

    const titres = listCirculations()
      .filter((item) => item.kind === 'alerte')
      .map((item) => item.titre)

    expect(titres).toContain('Échéance dépassée : Préparation du culte')
    expect(titres).toContain('Demandes de budget en cours')
  })

  it('ne recrée pas une alerte déjà supprimée', () => {
    resetActivites()
    resetBudget()
    resetCirculations()
    syncAlertes()

    const alerte = listCirculations().find((item) => item.titre.startsWith('Échéance dépassée'))
    expect(alerte).toBeTruthy()
    deleteCirculation(alerte!.id)
    syncAlertes()

    expect(listCirculations().some((item) => item.titre.startsWith('Échéance dépassée'))).toBe(false)
  })
})
