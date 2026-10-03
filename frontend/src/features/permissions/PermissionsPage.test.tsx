import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp, seConnecter } from '@/test/renderApp'

describe('écran Permissions', () => {
  it("mène à la liste depuis le menu, puis permet d'en créer une", async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    await user.click(screen.getByRole('button', { name: 'Administration' }))
    await user.click(screen.getByRole('link', { name: 'Permissions' }))

    expect(await screen.findByRole('heading', { name: 'Permissions' })).toBeTruthy()
    expect(await screen.findByText('Consulter les personnes')).toBeTruthy()
    expect(screen.queryByText('membres.read')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Nouvelle permission' }))
    await user.selectOptions(screen.getByLabelText('Rubrique'), 'rapports')
    await user.selectOptions(screen.getByLabelText('Ce que la personne peut faire'), 'print')
    await user.type(screen.getByLabelText('Intitulé du droit'), 'Imprimer un rapport')
    await user.click(screen.getByRole('button', { name: 'Créer le droit' }))

    await waitFor(() => expect(screen.getByText('Imprimer un rapport')).toBeTruthy())
    expect(screen.queryByText('rapports.print')).toBeNull()
  })

  it('ouvre les accès d’une permission et retire le droit d’un rôle', async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    await user.click(screen.getByRole('button', { name: 'Administration' }))
    await user.click(screen.getByRole('link', { name: 'Permissions' }))

    await user.type(await screen.findByLabelText('Rechercher une permission'), 'Demander une dépense')
    await user.click(screen.getByRole('button', { name: 'Rechercher' }))

    await user.click(
      await screen.findByRole('button', { name: 'Voir les accès de Demander une dépense' }),
    )
    expect(await screen.findByRole('heading', { name: 'Qui a ce droit — Demander une dépense' })).toBeTruthy()
    expect(await screen.findByText('Pierre MWAMBA')).toBeTruthy()
    expect(await screen.findByText('Ruth NGOY')).toBeTruthy()
    expect((await screen.findAllByText('Chef de département')).length).toBeGreaterThan(0)

    await user.click(
      screen.getByRole('button', { name: 'Retirer « Demander une dépense » de Chef de département' }),
    )
    await waitFor(() => expect(screen.queryByText('Pierre MWAMBA')).toBeNull())
    expect(screen.getByText('Ruth NGOY')).toBeTruthy()
  })

  it("refuse le catalogue des permissions au pasteur", async () => {
    const { user } = renderApp('/permissions')

    await seConnecter(user, 'pasteur@eglise.org', 'Pasteur2026!')

    expect(await screen.findByRole('heading', { name: 'Accès refusé' })).toBeTruthy()
  })
})
