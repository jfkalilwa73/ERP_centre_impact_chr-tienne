import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp, seConnecter } from '@/test/renderApp'

describe('écran Audit', () => {
  it('mène à la liste depuis le menu, puis ouvre une fiche en lecture seule', async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    await user.click(screen.getByRole('button', { name: 'Administration' }))
    await user.click(screen.getByRole('link', { name: 'Audit' }))

    expect(await screen.findByRole('heading', { name: 'Audit' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Nouveau|Créer/ })).toBeNull()

    const created = await screen.findByRole('link', { name: 'Personne créée' })
    await user.click(created)

    expect(await screen.findByRole('heading', { name: 'Personne créée' })).toBeTruthy()
    expect(await screen.findByText(/"nom": "KABILA"/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Modifier|Supprimer/ })).toBeNull()
  })

  it("refuse la section Audit à qui n'a pas audit.read", async () => {
    const { user } = renderApp('/audit')

    await seConnecter(user, 'accueil@eglise.org', 'Accueil2026!')

    expect(await screen.findByRole('heading', { name: 'Accès refusé' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    expect(screen.queryByRole('link', { name: 'Audit' })).toBeNull()
  })
})
