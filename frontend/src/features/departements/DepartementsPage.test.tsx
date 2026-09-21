import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp, seConnecter } from '@/test/renderApp'

async function ouvrirDepartements(user: Awaited<ReturnType<typeof renderApp>>['user']) {
  await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
  await user.click(screen.getAllByRole('button', { name: 'Départements' })[0]!)
  await user.click(screen.getAllByRole('link', { name: 'Tous les départements' })[0]!)
}

describe('écran Départements', () => {
  it("mène à la liste depuis le menu, puis permet d'en créer un", async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })
    await ouvrirDepartements(user)

    expect(await screen.findByRole('heading', { name: /Bonjour Jean/ })).toBeTruthy()
    expect(await screen.findByText('Paix et grâce à vous.')).toBeTruthy()
    expect(
      await screen.findByText("Que chaque département serve l'Église avec fidélité."),
    ).toBeTruthy()
    expect(await screen.findByText(/Il y a diversité de dons/)).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Départements' })).toBeTruthy()
    expect(await screen.findByText('Évolution globale')).toBeTruthy()
    expect(await screen.findByText('Effectifs par département')).toBeTruthy()
    expect(screen.queryByText('Création des départements')).toBeNull()
    expect(screen.queryByText('Évolution des activités')).toBeNull()
    expect(await screen.findByText('ACCUEIL')).toBeTruthy()
    expect(await screen.findByRole('columnheader', { name: 'Chef' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Nouveau département' }))
    expect(screen.queryByLabelText('Site')).toBeNull()
    await user.type(screen.getByLabelText('Code'), 'JEUNESSE')
    await user.type(screen.getByLabelText('Nom'), 'Département Jeunesse')
    await user.click(screen.getByRole('button', { name: 'Créer le département' }))

    await waitFor(() => expect(screen.getByText('JEUNESSE')).toBeTruthy())
    expect(screen.getAllByText('Département Jeunesse').length).toBeGreaterThan(0)
  })

  it('permet de désigner un chef depuis la page centrale', async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })
    await ouvrirDepartements(user)

    await user.click(await screen.findByRole('button', { name: 'Désigner le chef de Département Diaconie' }))
    await user.click(await screen.findByRole('button', { name: 'Désigner Paul KALONJI' }))
    await waitFor(() => expect(screen.getAllByText('Paul KALONJI').length).toBeGreaterThan(0))
  })

  it("ouvre l'interface d'un département avec membres, graphique et activités", async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })
    await ouvrirDepartements(user)

    await user.click((await screen.findAllByRole('link', { name: 'Département Accueil' }))[0]!)
    expect(await screen.findByRole('heading', { name: 'Département Accueil' })).toBeTruthy()
    expect(await screen.findByText('Paix et grâce à vous.')).toBeTruthy()
    expect(await screen.findByText(/Il y a diversité de dons|Que chacun mette au service|Que tout se fasse/)).toBeTruthy()
    expect(await screen.findByText('Membres affectés')).toBeTruthy()
    expect(await screen.findByText('Hommes')).toBeTruthy()
    expect(await screen.findByText('Femmes')).toBeTruthy()
    expect(screen.queryByText('Personnes retirées')).toBeNull()
    expect(await screen.findByText('Évolution du département')).toBeTruthy()
    expect(await screen.findByText('Évolution des activités')).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: 'Membres' }))
    expect(await screen.findByRole('button', { name: 'Affecter un membre' })).toBeTruthy()
    expect((await screen.findAllByText('Jean KABILA')).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('tab', { name: 'Activités' }))
    await user.type(screen.getByLabelText("Titre de l'activité"), 'Réunion accueil')
    await user.type(screen.getByLabelText("Date de l'activité"), '2026-09-30')
    await user.click(screen.getByRole('button', { name: "Ajouter l'activité" }))
    expect(await screen.findByText('Réunion accueil')).toBeTruthy()
  })

  it('laisse consulter sans proposer de création à un compte lecture seule', async () => {
    const { user } = renderApp()

    await seConnecter(user, 'accueil@eglise.org', 'Accueil2026!')
    await screen.findByRole('heading', { name: /Bonjour Grâce/ })
    await ouvrirDepartements(user)

    expect(await screen.findByRole('heading', { name: 'Départements' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Nouveau département' })).toBeNull()
  })

  it("refuse la section à qui n'a pas departements.read", async () => {
    const { user } = renderApp('/departements')

    await seConnecter(user, 'pasteur@eglise.org', 'Pasteur2026!')

    expect(await screen.findByRole('heading', { name: 'Accès refusé' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    expect(screen.queryByRole('button', { name: 'Départements' })).toBeNull()
  })
})
