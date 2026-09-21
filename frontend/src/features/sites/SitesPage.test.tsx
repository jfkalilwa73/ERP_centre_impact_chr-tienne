import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp, seConnecter } from '@/test/renderApp'

describe('écran Sites', () => {
  it("n'expose plus le concept de site dans le menu", async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    expect(screen.queryByRole('link', { name: 'Sites' })).toBeNull()
  })

  it("n'ouvre plus de page Sites", async () => {
    const { user } = renderApp('/sites')

    await seConnecter(user)
    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeTruthy()
  })
})
