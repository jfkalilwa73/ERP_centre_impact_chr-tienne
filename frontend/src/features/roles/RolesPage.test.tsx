import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp, seConnecter } from '@/test/renderApp'

describe('écran Rôles', () => {
  it("mène à la liste depuis le menu, puis permet d'en créer un et d'y attribuer une permission", async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    await user.click(screen.getByRole('button', { name: 'Administration' }))
    await user.click(screen.getByRole('link', { name: 'Rôles' }))

    expect(await screen.findByRole('heading', { name: 'Rôles' })).toBeTruthy()
    expect(await screen.findByText('ADMIN_FONCTIONNEL')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Nouveau rôle' }))
    await user.type(screen.getByLabelText('Code'), 'LECTEUR')
    await user.type(screen.getByLabelText('Nom'), 'Lecteur')
    await user.click(screen.getByRole('button', { name: 'Créer le rôle' }))

    await waitFor(() => expect(screen.getByText('LECTEUR')).toBeTruthy())
    expect(screen.getByRole('link', { name: 'Lecteur' })).toBeTruthy()

    await user.click(screen.getByRole('link', { name: 'Lecteur' }))
    expect(await screen.findByRole('heading', { name: 'Lecteur' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Attribuer une permission' }))
    expect(await screen.findByRole('option', { name: /membres.read/ })).toBeTruthy()
    await user.selectOptions(
      screen.getByLabelText('Permission'),
      screen.getByRole('option', { name: /membres.read/ }),
    )
    await user.click(screen.getByRole('button', { name: 'Enregistrer la permission' }))

    expect(await screen.findByText('membres.read')).toBeTruthy()
  })

  it("refuse l'administration des rôles au pasteur", async () => {
    const { user } = renderApp('/roles')

    await seConnecter(user, 'pasteur@eglise.org', 'Pasteur2026!')

    expect(await screen.findByRole('heading', { name: 'Accès refusé' })).toBeTruthy()
  })

  it("refuse la section Rôles à qui n'a pas roles.manage", async () => {
    const { user } = renderApp('/roles')

    await seConnecter(user, 'accueil@eglise.org', 'Accueil2026!')

    expect(await screen.findByRole('heading', { name: 'Accès refusé' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    expect(screen.queryByRole('link', { name: 'Rôles' })).toBeNull()
  })
})
