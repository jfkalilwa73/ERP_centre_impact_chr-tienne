import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp, seConnecter } from '@/test/renderApp'

describe('navigation authentifiée', () => {
  it('redirige un visiteur non connecté vers la page de connexion', async () => {
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeTruthy()
  })

  it("mène au tableau de bord après une connexion valide et y maintient l'utilisateur", async () => {
    const { user } = renderApp()

    await seConnecter(user)

    expect(await screen.findByRole('heading', { name: /Bonjour Jean/ })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    expect(screen.queryByRole('link', { name: 'Sites' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Connexion' })).toBeNull()
  })

  it('affiche un message clair quand les identifiants sont refusés', async () => {
    const { user } = renderApp()

    await user.type(screen.getByLabelText('Adresse e-mail'), 'admin@eglise.org')
    await user.type(screen.getByLabelText('Mot de passe'), 'MauvaisMotDePasse')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByText('Adresse e-mail ou mot de passe incorrect.')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Connexion' })).toBeTruthy()
  })

  it('valide le formulaire sans appeler le serveur quand les champs sont invalides', async () => {
    const { user } = renderApp()

    await user.type(screen.getByLabelText('Adresse e-mail'), 'pas-un-email')
    await user.type(screen.getByLabelText('Mot de passe'), 'court')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByText('Saisissez une adresse e-mail valide.')).toBeTruthy()
    expect(
      screen.getByText('Le mot de passe doit contenir au moins 8 caractères.'),
    ).toBeTruthy()
  })

  it('ramène à la page de connexion après une déconnexion', async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })

    await user.click(screen.getAllByRole('button', { name: /Déconnexion/ })[0]!)

    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeTruthy()
  })

  it("n'ouvre qu'un groupe de menu à la fois et garde la déconnexion visible", async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })
    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    await user.click(screen.getByRole('button', { name: 'Départements' }))

    expect(screen.getByRole('button', { name: 'Départements' }).getAttribute('aria-expanded')).toBe(
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'Administration' }))

    expect(screen.getByRole('button', { name: 'Départements' }).getAttribute('aria-expanded')).toBe(
      'false',
    )
    expect(screen.getByRole('button', { name: 'Administration' }).getAttribute('aria-expanded')).toBe(
      'true',
    )
    expect(screen.getAllByRole('button', { name: /Déconnexion/ }).length).toBeGreaterThan(0)
  })
})
