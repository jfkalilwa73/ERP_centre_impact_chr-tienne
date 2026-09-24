import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp, seConnecter } from '@/test/renderApp'

async function seDeconnecter(user: Awaited<ReturnType<typeof renderApp>>['user']) {
  await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
  const boutons = screen.getAllByRole('button', { name: 'Déconnexion' })
  await user.click(boutons[boutons.length - 1]!)
  expect(await screen.findByRole('heading', { name: 'Connexion' }, { timeout: 8000 })).toBeTruthy()
}

describe('notifications superviseur', () => {
  it('envoie la demande du chef, puis l’admin ouvre le compte', async () => {
    const { user } = renderApp()

    await seConnecter(user, 'chef-louange@eglise.org', 'ChefDep2026!')
    expect(await screen.findByRole('heading', { name: 'Département Louange' }, { timeout: 8000 })).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: 'Membres' }))
    await user.click(await screen.findByRole('button', { name: 'Affecter un membre' }))
    await user.selectOptions(
      screen.getByLabelText('Personne à affecter'),
      await screen.findByRole('option', { name: 'Patrick MWAMBA' }),
    )
    await user.selectOptions(screen.getByLabelText('Rôle dans le département'), 'Superviseur')
    await user.click(screen.getByRole('button', { name: 'Envoyer la demande' }))

    expect(await screen.findByText(/Demande envoyée à l’administrateur/)).toBeTruthy()
    expect(screen.queryByRole('cell', { name: /Patrick MWAMBA/ })).toBeNull()

    await seDeconnecter(user)

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })
    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    await user.click(screen.getByRole('link', { name: /Notifications/ }))

    expect(await screen.findByRole('heading', { name: 'Notifications' })).toBeTruthy()
    expect(await screen.findByText('Patrick MWAMBA')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Ouvrir le compte' }))
    expect(await screen.findByRole('heading', { name: 'Ouvrir le compte superviseur' })).toBeTruthy()
    await user.clear(screen.getByLabelText('Adresse e-mail'))
    await user.type(screen.getByLabelText('Adresse e-mail'), 'patrick.superviseur@eglise.org')
    await user.type(screen.getByLabelText('Mot de passe'), 'SecurePass123!')
    await user.click(screen.getByRole('button', { name: 'Créer le compte et prévenir le chef' }))

    expect(await screen.findByText('Compte ouvert', {}, { timeout: 8000 })).toBeTruthy()
    expect(await screen.findByText('patrick.superviseur@eglise.org')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Ouvrir le compte superviseur' })).toBeNull()

    await seDeconnecter(user)

    await seConnecter(user, 'chef-louange@eglise.org', 'ChefDep2026!')
    await user.click(await screen.findByRole('button', { name: 'Ouvrir le menu' }, { timeout: 8000 }))
    await user.click(screen.getByRole('link', { name: /Notifications/ }))

    expect(await screen.findByText('Compte ouvert')).toBeTruthy()
    expect(await screen.findByText('patrick.superviseur@eglise.org')).toBeTruthy()

    await seDeconnecter(user)

    await seConnecter(user, 'patrick.superviseur@eglise.org', 'SecurePass123!')
    await user.click(await screen.findByRole('button', { name: 'Ouvrir le menu' }, { timeout: 8000 }))
    await user.click(
      (await screen.findAllByRole('button', { name: 'Départements' }, { timeout: 8000 }))[0]!,
    )
    await user.click((await screen.findAllByRole('link', { name: 'Département Louange' }))[0]!)
    expect(await screen.findByRole('heading', { name: 'Département Louange' }, { timeout: 8000 })).toBeTruthy()
  }, 30000)

  it('envoie un rapport au superviseur, au pasteur et à l’admin ; seul le destinataire répond', async () => {
    const { user } = renderApp()

    await seConnecter(user, 'chef-louange@eglise.org', 'ChefDep2026!')
    expect(await screen.findByRole('heading', { name: 'Département Louange' }, { timeout: 8000 })).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: 'Rapports' }))
    await user.type(screen.getByLabelText('Titre du rapport'), 'Bilan répétition')
    await user.type(screen.getByLabelText('Description du rapport'), 'Choeur complet.')
    await user.click(screen.getByRole('button', { name: 'Envoyer le rapport' }))
    expect(await screen.findByText('Bilan répétition')).toBeTruthy()

    await seDeconnecter(user)
    await seConnecter(user, 'superviseur@eglise.org', 'Superviseur2026!')
    await user.click(await screen.findByRole('button', { name: 'Ouvrir le menu' }, { timeout: 8000 }))
    await user.click(screen.getByRole('link', { name: /Notifications/ }))
    expect(await screen.findByText('Bilan répétition')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Répondre' })).toBeNull()
    expect(screen.getByText(/Consultation uniquement/)).toBeTruthy()

    await seDeconnecter(user)
    await seConnecter(user, 'pasteur@eglise.org', 'Pasteur2026!')
    await user.click(await screen.findByRole('button', { name: 'Ouvrir le menu' }, { timeout: 8000 }))
    await user.click(screen.getByRole('link', { name: /Notifications/ }))
    expect(await screen.findByText('Bilan répétition')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Répondre' })).toBeNull()

    await seDeconnecter(user)
    await seConnecter(user)
    await user.click(await screen.findByRole('button', { name: 'Ouvrir le menu' }, { timeout: 8000 }))
    await user.click(screen.getByRole('link', { name: /Notifications/ }))
    expect(await screen.findByText('Bilan répétition')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Répondre' })).toBeNull()

    await seDeconnecter(user)
    await seConnecter(user, 'chef-louange@eglise.org', 'ChefDep2026!')
    await user.click(await screen.findByRole('button', { name: 'Ouvrir le menu' }, { timeout: 8000 }))
    await user.click(screen.getByRole('link', { name: /Notifications/ }))
    expect(await screen.findByText('Bilan répétition')).toBeTruthy()
    await user.type(screen.getByLabelText('Réponse au message'), 'Bien reçu, on ajuste le choeur.')
    await user.click(screen.getByRole('button', { name: 'Répondre' }))
    expect(await screen.findByText('Bien reçu, on ajuste le choeur.')).toBeTruthy()
  }, 45000)
})
