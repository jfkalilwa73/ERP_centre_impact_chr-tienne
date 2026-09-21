import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp, seConnecter } from '@/test/renderApp'

describe('écran Comptes', () => {
  it('mène à la liste depuis le menu, puis permet d’ouvrir un compte', async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    await user.click(screen.getByRole('button', { name: 'Administration' }))
    await user.click(screen.getByRole('link', { name: 'Comptes' }))

    expect(await screen.findByRole('heading', { name: 'Comptes' })).toBeTruthy()
    expect(await screen.findByRole('link', { name: 'admin@eglise.org' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Nouveau compte' }))
    await user.selectOptions(
      screen.getByLabelText('Personne rattachée'),
      await screen.findByRole('option', { name: 'Ruth NGOY' }),
    )
    await user.type(screen.getByLabelText('Adresse e-mail'), 'ruth@eglise.org')
    await user.type(screen.getByLabelText('Mot de passe'), 'SecurePass123!')
    await user.click(screen.getByRole('button', { name: 'Créer le compte' }))

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'ruth@eglise.org' })).toBeTruthy(),
    )
  })

  it('ouvre la fiche et permet d’attribuer un rôle', async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    await user.click(screen.getByRole('button', { name: 'Administration' }))
    await user.click(screen.getByRole('link', { name: 'Comptes' }))
    await user.click(await screen.findByRole('link', { name: 'pasteur@eglise.org' }))

    expect(await screen.findByRole('heading', { name: 'pasteur@eglise.org' })).toBeTruthy()
    expect(await screen.findByRole('cell', { name: /PASTEUR_SITE/ })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Attribuer un rôle' }))
    await user.selectOptions(
      screen.getByLabelText('Rôle'),
      await screen.findByRole('option', { name: /RESPONSABLE_ACCUEIL/ }),
    )
    await user.click(screen.getByRole('button', { name: 'Enregistrer le rôle' }))

    expect(await screen.findByRole('cell', { name: /RESPONSABLE_ACCUEIL/ })).toBeTruthy()
  })

  it('cache le module à un compte dépourvu du droit comptes.read', async () => {
    const { user } = renderApp()

    await seConnecter(user, 'accueil@eglise.org', 'Accueil2026!')
    await screen.findByRole('heading', { name: /Bonjour Grâce/ })

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))

    expect(screen.queryByRole('button', { name: 'Administration' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Comptes' })).toBeNull()
  })
})
