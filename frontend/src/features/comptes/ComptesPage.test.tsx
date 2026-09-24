import { screen } from '@testing-library/react'
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
      await screen.findByRole('option', { name: 'Patrick MWAMBA' }),
    )
    await user.type(screen.getByLabelText('Adresse e-mail'), 'patrick@eglise.org')
    await user.type(screen.getByLabelText('Mot de passe'), 'SecurePass123!')
    await user.click(await screen.findByRole('checkbox', { name: /Responsable accueil/ }))
    await user.click(screen.getByRole('button', { name: 'Créer le compte' }))

    const compteLink = await screen.findByRole('link', { name: 'patrick@eglise.org' }, { timeout: 8000 })
    expect(compteLink).toBeTruthy()

    await user.click(compteLink)
    expect(await screen.findByRole('cell', { name: /RESPONSABLE_ACCUEIL/ })).toBeTruthy()
  })

  it('refuse de créer un compte sans rôle', async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    await user.click(screen.getByRole('button', { name: 'Administration' }))
    await user.click(screen.getByRole('link', { name: 'Comptes' }))
    await user.click(await screen.findByRole('button', { name: 'Nouveau compte' }))

    await user.selectOptions(
      screen.getByLabelText('Personne rattachée'),
      await screen.findByRole('option', { name: 'Patrick MWAMBA' }),
    )
    await user.type(screen.getByLabelText('Adresse e-mail'), 'patrick@eglise.org')
    await user.type(screen.getByLabelText('Mot de passe'), 'SecurePass123!')
    await user.click(screen.getByRole('button', { name: 'Créer le compte' }))

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByText(/Attribuez au moins un rôle/)).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'patrick@eglise.org' })).toBeNull()
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
    expect(await screen.findByRole('cell', { name: /PASTEUR/ })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Attribuer un rôle' }))
    await user.selectOptions(
      screen.getByLabelText('Rôle'),
      await screen.findByRole('option', { name: /RESPONSABLE_ACCUEIL/ }),
    )
    await user.click(screen.getByRole('button', { name: 'Enregistrer le rôle' }))

    expect(await screen.findByRole('cell', { name: /RESPONSABLE_ACCUEIL/ })).toBeTruthy()
  })

  it("refuse les comptes au pasteur", async () => {
    const { user } = renderApp('/comptes')

    await seConnecter(user, 'pasteur@eglise.org', 'Pasteur2026!')

    expect(await screen.findByRole('heading', { name: 'Accès refusé' })).toBeTruthy()
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
