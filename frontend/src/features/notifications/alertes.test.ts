import { describe, expect, it } from 'vitest'
import { resetActivites } from '@/features/departements/activites'
import { resetBudget } from '@/features/departements/budget'
import { resetActivitesFamille } from '@/features/familles/activites'
import { syncAlertes } from './alertes'
import { deleteCirculation, listCirculations, resetCirculations } from './circulation'

describe('alertes', () => {
  it('place les échéances et le budget en attente dans la circulation', () => {
    resetActivites()
    resetActivitesFamille()
    resetBudget()
    resetCirculations()
    syncAlertes()

    const titres = listCirculations()
      .filter((item) => item.kind === 'alerte')
      .map((item) => item.titre)

    expect(titres).toContain('Demandes de budget en cours')
    expect(titres).toContain('Présence faible : Daniel KASONGO')
    expect(titres).toContain('Présence faible : Pierre MWAMBA')
    expect(
      listCirculations().find((item) => item.titre === 'Présence faible : Daniel KASONGO')?.description,
    ).toContain('DGE')
    expect(
      listCirculations()
        .filter((item) => item.kind === 'compte_rendu')
        .map((item) => item.titre),
    ).toContain('Compte rendu à produire : Préparation du culte')
  })

  it('ne recrée pas une alerte déjà supprimée', () => {
    resetActivites()
    resetActivitesFamille()
    resetBudget()
    resetCirculations()
    syncAlertes()

    const demande = listCirculations().find((item) =>
      item.titre.startsWith('Compte rendu à produire : Préparation du culte'),
    )
    expect(demande).toBeTruthy()
    deleteCirculation(demande!.id)
    syncAlertes()

    expect(
      listCirculations().some((item) =>
        item.titre.startsWith('Compte rendu à produire : Préparation du culte'),
      ),
    ).toBe(false)
  })
})
