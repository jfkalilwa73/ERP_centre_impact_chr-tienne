import { describe, expect, it } from 'vitest'
import { login } from '@/features/auth/api'
import { useAuthStore } from '@/stores/authStore'
import {
  demanderDepense,
  enregistrerRentree,
  resetBudget,
  syntheseBudget,
} from './budget'

const LOUANGE_ID = 'd4f6b8c0-0006-4000-8000-000000000002'
const ACCUEIL_ID = 'd4f6b8c0-0006-4000-8000-000000000001'

async function ouvrirSession(email: string, motDePasse: string) {
  const response = await login({ email, motDePasse })
  useAuthStore.getState().openSession(response)
}

describe('budget', () => {
  it('ajoute les rentrées au disponible de la caisse', () => {
    resetBudget()
    const avant = syntheseBudget(LOUANGE_ID)
    expect(avant.rentrees).toBe(200)
    expect(avant.disponible).toBe(avant.alloue + avant.rentrees - avant.engage)

    enregistrerRentree(LOUANGE_ID, { motif: 'Concert', montant: 50, date: '2026-09-20' })
    const apres = syntheseBudget(LOUANGE_ID)
    expect(apres.rentrees).toBe(250)
    expect(apres.disponible).toBe(avant.disponible + 50)
  })

  it('refuse un découvert sur la caisse de l’unité', () => {
    resetBudget()
    const disponible = syntheseBudget(LOUANGE_ID).disponible
    expect(demanderDepense(LOUANGE_ID, { motif: 'Trop', montant: disponible + 1 })).toBeUndefined()
    expect(syntheseBudget(LOUANGE_ID).disponible).toBe(disponible)
  })

  it('refuse un montant invalide', () => {
    resetBudget()
    expect(enregistrerRentree(LOUANGE_ID, { motif: 'Négatif', montant: -20 })).toBeUndefined()
    expect(demanderDepense(LOUANGE_ID, { motif: 'Zéro', montant: 0 })).toBeUndefined()
  })

  it('refuse l’écriture hors périmètre et l’autorise au chef sur son unité', async () => {
    resetBudget()
    await ouvrirSession('accueil@eglise.org', 'Accueil2026!')
    expect(demanderDepense(LOUANGE_ID, { motif: 'Vol', montant: 10 })).toBeUndefined()

    await ouvrirSession('chef-louange@eglise.org', 'ChefDep2026!')
    expect(demanderDepense(LOUANGE_ID, { motif: 'Cordes', montant: 45 })).toMatchObject({
      montant: 45,
      statut: 'validee',
    })
    expect(demanderDepense(ACCUEIL_ID, { motif: 'Vol', montant: 10 })).toBeUndefined()
  })
})
