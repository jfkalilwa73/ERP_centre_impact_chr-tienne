import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp, seConnecter } from '@/test/renderApp'

async function ouvrirFamilles(user: Awaited<ReturnType<typeof renderApp>>['user']) {
  await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
  await user.click(screen.getAllByRole('button', { name: "Familles d'impact" })[0]!)
  const tableau = screen.queryAllByRole('link', { name: 'Tableau de bord' })
  const catalog = screen.queryAllByRole('link', { name: "Toutes les familles d'impact" })
  await user.click((tableau[0] ?? catalog[0])!)
}

describe("écran Familles d'impact", () => {
  it("mène à la liste depuis le menu, puis permet d'en créer une", async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })
    await ouvrirFamilles(user)

    expect(await screen.findByRole('heading', { name: /Bonjour Jean/ })).toBeTruthy()
    expect(await screen.findByText('Paix et grâce à vous.')).toBeTruthy()
    expect(
      await screen.findByText("Que chaque famille d'impact serve l'Église avec fidélité."),
    ).toBeTruthy()
    expect(await screen.findByText(/Il y a diversité de dons/)).toBeTruthy()
    expect(await screen.findByRole('heading', { name: "Familles d'impact" })).toBeTruthy()
    expect(await screen.findByText('Évolution globale')).toBeTruthy()
    expect(await screen.findByText('Effectifs par famille')).toBeTruthy()
    expect(screen.queryByText('Évolution des activités')).toBeNull()
    expect(await screen.findByText('BATISSEURS')).toBeTruthy()
    expect(await screen.findByRole('columnheader', { name: 'Superviseur' })).toBeTruthy()
    expect(await screen.findByRole('columnheader', { name: 'Chef' })).toBeTruthy()
    expect(await screen.findByRole('tab', { name: 'Tableau de bord' })).toBeTruthy()
    expect(await screen.findByRole('tab', { name: 'Suivi DGE' })).toBeTruthy()
    expect(await screen.findByRole('tab', { name: 'Rapports reçus' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Nouvelle famille' }))
    await user.type(screen.getByLabelText('Code'), 'ESPERANCE')
    await user.type(screen.getByLabelText('Nom'), 'Espérance')
    await user.type(screen.getByLabelText('Zone'), 'Ouest')
    await user.click(screen.getByRole('button', { name: 'Créer la famille' }))

    await waitFor(() => expect(screen.getByText('ESPERANCE')).toBeTruthy())
    expect(screen.getAllByText('Espérance').length).toBeGreaterThan(0)
  })

  it('permet de désigner un chef depuis la page centrale', async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })
    await ouvrirFamilles(user)

    await user.click(await screen.findByRole('button', { name: 'Désigner le chef de Grâce' }))
    await user.click(await screen.findByRole('button', { name: 'Désigner Marie TSHISEKEDI' }))
    await waitFor(() => expect(screen.getAllByText('Marie TSHISEKEDI').length).toBeGreaterThan(0))
  })

  it("ouvre l'interface d'une famille avec membres, graphique et activités", async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })
    await ouvrirFamilles(user)

    await user.click((await screen.findAllByRole('link', { name: 'Bâtisseurs' }))[0]!)
    expect(await screen.findByRole('heading', { name: 'Bâtisseurs' })).toBeTruthy()
    expect(await screen.findByText('Paix et grâce à vous.')).toBeTruthy()
    expect(
      await screen.findByText(/Il y a diversité de dons|Que chacun mette au service|Que tout se fasse/),
    ).toBeTruthy()
    expect(await screen.findByText('Membres affectés')).toBeTruthy()
    expect(await screen.findByText('Hommes')).toBeTruthy()
    expect(await screen.findByText('Femmes')).toBeTruthy()
    expect(await screen.findByText('Évolution de la famille')).toBeTruthy()
    expect(await screen.findByText('Évolution des activités')).toBeTruthy()
    expect(await screen.findByText('Taux de présence des membres')).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: 'Membres' }))
    expect(await screen.findByRole('button', { name: 'Affecter un membre' })).toBeTruthy()
    expect((await screen.findAllByText('Jean KABILA')).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('tab', { name: 'Activités' }))
    await user.type(screen.getByLabelText("Titre de l'activité"), 'Réunion bâtisseurs')
    await user.type(screen.getByLabelText("Date de l'activité"), '2026-09-30')
    await user.click(screen.getByRole('button', { name: "Ajouter l'activité" }))
    expect(await screen.findByText('Réunion bâtisseurs')).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: 'Budget' }))
    expect(screen.getByText('Cotisations de cellule')).toBeTruthy()
    await user.type(screen.getByLabelText('Motif de la rentrée'), 'Offrande de famille')
    await user.type(screen.getByLabelText('Montant de la rentrée'), '40')
    await user.click(screen.getByRole('button', { name: 'Enregistrer la rentrée' }))
    expect(await screen.findByText('Offrande de famille')).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: 'Rapports' }))
    expect((await screen.findAllByText("Rentrée d'argent : Offrande de famille")).length).toBeGreaterThan(
      0,
    )
  })

  it('laisse consulter sans proposer de création à un compte lecture seule', async () => {
    const { user } = renderApp()

    await seConnecter(user, 'accueil@eglise.org', 'Accueil2026!')
    await screen.findByRole('heading', { name: /Bonjour Grâce/ })
    await ouvrirFamilles(user)

    expect(await screen.findByRole('heading', { name: "Familles d'impact" })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Nouvelle famille' })).toBeNull()
  })

  it('laisse le pasteur consulter le catalogue sans créer', async () => {
    const { user } = renderApp('/familles')

    await seConnecter(user, 'pasteur@eglise.org', 'Pasteur2026!')

    expect(await screen.findByRole('heading', { name: "Familles d'impact" })).toBeTruthy()
    expect(await screen.findByText('BATISSEURS')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Nouvelle famille' })).toBeNull()
    expect(screen.queryByRole('tab', { name: 'Suivi DGE' })).toBeNull()
  })

  it('permet au DGE de suivre les demandes et rapports des familles', async () => {
    const { user } = renderApp()

    await seConnecter(user, 'dge@eglise.org', 'Dge2026!')
    await screen.findByRole('heading', { name: /Bonjour Esther/ }, { timeout: 8000 })
    await ouvrirFamilles(user)

    expect(await screen.findByRole('tab', { name: 'Suivi DGE' })).toBeTruthy()
    expect(await screen.findByRole('tab', { name: 'Rapports reçus' })).toBeTruthy()
    expect(screen.queryByText('Compte rendu août')).toBeNull()

    await user.click(screen.getAllByRole('tab', { name: 'Rapports reçus' })[0]!)
    expect(await screen.findByText('Compte rendu août')).toBeTruthy()
    expect(await screen.findByText(/Famille Bâtisseurs/)).toBeTruthy()
  })

  it("limite un chef de famille à son seul tableau de bord", async () => {
    const { user } = renderApp()

    await seConnecter(user, 'chef-famille@eglise.org', 'ChefFamille2026!')

    expect(await screen.findByRole('heading', { name: 'Bâtisseurs' }, { timeout: 8000 })).toBeTruthy()
    expect(await screen.findByText('Membres affectés')).toBeTruthy()
    expect(screen.queryByRole('link', { name: "Toutes les familles d'impact" })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Personnes' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Départements' })).toBeNull()
  })
})
