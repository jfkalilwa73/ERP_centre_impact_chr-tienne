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

    expect(await screen.findByText('JEUNESSE', {}, { timeout: 8000 })).toBeTruthy()
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

  it('laisse le pasteur consulter le catalogue sans créer', async () => {
    const { user } = renderApp('/departements')

    await seConnecter(user, 'pasteur@eglise.org', 'Pasteur2026!')

    expect(await screen.findByRole('heading', { name: 'Départements' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Nouveau département' })).toBeNull()
  })

  it("limite un chef de département à son seul tableau de bord", async () => {
    const { user } = renderApp()

    await seConnecter(user, 'chef-louange@eglise.org', 'ChefDep2026!')

    expect(await screen.findByRole('heading', { name: 'Département Louange' }, { timeout: 8000 })).toBeTruthy()
    expect(await screen.findByText('Membres affectés')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Personnes' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Tous les départements' })).toBeNull()
    expect(screen.queryByRole('button', { name: "Familles d'impact" })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    expect(screen.queryByRole('link', { name: 'Accueil' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Personnes' })).toBeNull()
  })

  it('donne au chef équipe, activités, budget et rapports', async () => {
    const { user } = renderApp()

    await seConnecter(user, 'chef-louange@eglise.org', 'ChefDep2026!')
    expect(await screen.findByRole('heading', { name: 'Département Louange' }, { timeout: 8000 })).toBeTruthy()
    expect(await screen.findByText('Budget alloué')).toBeTruthy()
    expect(screen.getByText('Dépenses suivies')).toBeTruthy()
    expect(screen.getByText('Disponible')).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: 'Membres' }))
    expect(await screen.findByLabelText('Responsabilité de Pierre MWAMBA')).toBeTruthy()
    expect(screen.getByLabelText('Disponibilité de Pierre MWAMBA')).toBeTruthy()
    expect(await screen.findByText('Planification des bénévoles')).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: 'Activités' }))
    expect(screen.getByLabelText("Responsable de l'activité")).toBeTruthy()
    expect(screen.getByLabelText("Échéance de l'activité")).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Modifier' }).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('tab', { name: 'Budget' }))
    expect(screen.queryByText('Budget alloué')).toBeNull()
    expect(screen.getByRole('button', { name: 'Envoyer la demande' })).toBeTruthy()
    await user.type(screen.getByLabelText('Motif de la dépense'), 'Partitions')
    await user.type(screen.getByLabelText('Montant de la dépense'), '45')
    await user.click(screen.getByRole('button', { name: 'Envoyer la demande' }))
    expect(await screen.findByText('Partitions')).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: 'Rapports' }))
    expect(await screen.findByText('Objectifs et écarts')).toBeTruthy()
    expect(screen.getByRole('button', { name: "Créer le plan d'action" })).toBeTruthy()
    await user.type(screen.getByLabelText('Titre du rapport'), 'Point de semaine')
    await user.type(screen.getByLabelText('Description du rapport'), 'Répétition tenue.')
    await user.selectOptions(
      screen.getByLabelText('Département destinataire'),
      await screen.findByRole('option', { name: 'Département Accueil' }),
    )
    await user.click(screen.getByRole('button', { name: 'Envoyer le rapport' }))
    expect(await screen.findByText(/Destinataire : Département Accueil/)).toBeTruthy()
    expect(await screen.findByText('Point de semaine')).toBeTruthy()
    expect(
      screen.getAllByText(/Envoyé au superviseur, au pasteur et à l’administrateur/).length,
    ).toBeGreaterThan(0)
  }, 20000)

  it('limite un superviseur aux départements qui lui sont affectés', async () => {
    const { user } = renderApp()

    await seConnecter(user, 'superviseur@eglise.org', 'Superviseur2026!')

    expect(await screen.findByRole('heading', { name: 'Département Accueil' }, { timeout: 8000 })).toBeTruthy()
    expect(await screen.findByText(/Superviseur : Daniel KASONGO/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Affecter un membre' })).toBeNull()
    expect(await screen.findByText('Budget')).toBeTruthy()
    expect(await screen.findByText('Alertes')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Personnes' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Tous les départements' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    expect(screen.getAllByRole('link', { name: 'Département Accueil' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Département Louange' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: 'Département Diaconie' })).toBeNull()
  })
})
