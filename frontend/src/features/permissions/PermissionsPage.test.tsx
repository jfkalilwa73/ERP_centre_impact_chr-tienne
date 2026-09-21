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
    expect(await screen.findByText('membres.read')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Nouvelle permission' }))
    await user.type(screen.getByLabelText('Module'), 'rapports')
    await user.type(screen.getByLabelText('Action'), 'read')
    const codeField = screen.getByLabelText('Code')
    await user.clear(codeField)
    await user.type(codeField, 'rapports.read')
    await user.type(screen.getByLabelText('Description'), 'Consulter les rapports')
    await user.click(screen.getByRole('button', { name: 'Créer la permission' }))

    await waitFor(() => expect(screen.getByText('rapports.read')).toBeTruthy())
  })

  it("refuse la section Permissions à qui n'a pas roles.manage", async () => {
    const { user } = renderApp('/permissions')

    await seConnecter(user, 'pasteur@eglise.org', 'Pasteur2026!')

    expect(await screen.findByRole('heading', { name: 'Accès refusé' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    expect(screen.queryByRole('link', { name: 'Permissions' })).toBeNull()
  })
})
