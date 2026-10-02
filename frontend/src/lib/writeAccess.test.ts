import { describe, expect, it } from 'vitest'
import { login } from '@/features/auth/api'
import { addActivite } from '@/features/departements/activites'
import { listAllRapports } from '@/features/departements/rapports'
import { useAuthStore } from '@/stores/authStore'
import { canMutateUnite } from './writeAccess'
import { PERMISSIONS } from './permissions'

const LOUANGE_ID = 'd4f6b8c0-0006-4000-8000-000000000002'
const ACCUEIL_ID = 'd4f6b8c0-0006-4000-8000-000000000001'

async function ouvrirSession(email: string, motDePasse: string) {
  const response = await login({ email, motDePasse })
  useAuthStore.getState().openSession(response)
}

describe('contrôle des écritures d’unité', () => {
  it('autorise les tests unitaires sans session', () => {
    expect(canMutateUnite(LOUANGE_ID, [PERMISSIONS.BUDGET_REQUEST])).toBe(true)
  })

  it('empêche un compte catalogue d’écrire dans un autre département', async () => {
    await ouvrirSession('accueil@eglise.org', 'Accueil2026!')
    expect(canMutateUnite(LOUANGE_ID, [PERMISSIONS.BUDGET_REQUEST])).toBe(false)
    expect(addActivite(LOUANGE_ID, {
      titre: 'Intrusion',
      date: '2026-10-01',
      description: '',
    })).toBeUndefined()
    expect(listAllRapports()).toEqual([])
  })

  it('limite le chef à son unité', async () => {
    await ouvrirSession('chef-louange@eglise.org', 'ChefDep2026!')
    expect(canMutateUnite(LOUANGE_ID, [PERMISSIONS.ACTIVITES_CREATE])).toBe(true)
    expect(canMutateUnite(ACCUEIL_ID, [PERMISSIONS.ACTIVITES_CREATE])).toBe(false)
    expect(listAllRapports()).toEqual([])
  })
})

