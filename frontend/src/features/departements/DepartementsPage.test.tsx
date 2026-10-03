import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp, seConnecter } from '@/test/renderApp'

async function ouvrirDepartements(user: Awaited<ReturnType<typeof renderApp>>['user']) {
  await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
  await user.click(screen.getAllByRole('button', { name: 'Départements' })[0]!)
  const tableau = screen.queryAllByRole('link', { name: 'Tableau de bord' })
  const catalog = screen.queryAllByRole('link', { name: 'Tous les départements' })
  await user.click((tableau[0] ?? catalog[0])!)
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
    expect(await screen.findByRole('tab', { name: 'Tableau de bord' })).toBeTruthy()
    expect(await screen.findByRole('tab', { name: 'Suivi DGE' })).toBeTruthy()
    expect(await screen.findByRole('tab', { name: 'Rapports reçus' })).toBeTruthy()
    expect(await screen.findByText(/La DGE pilote les superviseurs/)).toBeTruthy()
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
    await user.click(await screen.findByRole('button', { name: 'Désigner Paul KALONJI comme chef' }))
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
    expect(await screen.findByText('Taux de présence des membres')).toBeTruthy()

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
    expect(await screen.findByText('Taux de présence des membres')).toBeTruthy()
    expect(await screen.findByText('Budget alloué')).toBeTruthy()
    expect(screen.getByText('Dépenses suivies')).toBeTruthy()
    expect(screen.getByText('Disponible')).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: 'Membres' }))
    expect(await screen.findByLabelText('Responsabilité de Pierre MWAMBA')).toBeTruthy()
    await user.click(await screen.findByRole('button', { name: 'Affecter un membre' }))
    const roles = [...screen.getByLabelText('Rôle dans le département').querySelectorAll('option')].map(
      (option) => option.textContent,
    )
    expect(roles).toEqual(['Adjoint', 'Responsable'])
    expect(screen.queryByRole('option', { name: 'Superviseur' })).toBeNull()
    expect(screen.queryByRole('option', { name: 'Chef' })).toBeNull()
    expect(screen.queryByRole('option', { name: 'Membre' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.getByLabelText('Disponibilité de Pierre MWAMBA')).toBeTruthy()
    expect(screen.queryByText('Planification des bénévoles')).toBeNull()

    await user.click(screen.getByRole('tab', { name: 'Activités' }))
    expect(screen.getByLabelText('Cette activité concerne')).toBeTruthy()
    expect(screen.getByLabelText("Type d'activité")).toBeTruthy()
    expect(screen.getByLabelText("Responsable de l'activité")).toBeTruthy()
    expect(screen.getByLabelText("Échéance de l'activité")).toBeTruthy()
    expect(screen.getByLabelText("Heure de l'activité")).toBeTruthy()
    expect(screen.getAllByText(/^Répétition$/).length).toBeGreaterThan(0)
    expect(screen.getByText(/chaque mardi et samedi · à 18 h · présentiel/)).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Modifier' }).length).toBeGreaterThan(0)

    await user.selectOptions(screen.getByLabelText("Type d'activité"), 'Constante')
    await user.click(screen.getByLabelText('Jour : Mardi'))
    await user.type(screen.getByLabelText("Titre de l'activité"), 'Répétition des bénévoles')
    await user.selectOptions(screen.getByLabelText('Cette activité concerne'), 'Bénévoles')
    await user.type(screen.getByLabelText("Date de début de l'activité"), '2026-09-29')
    await user.type(screen.getByLabelText("Heure de l'activité"), '17:30')
    await user.selectOptions(screen.getByLabelText('Modalité'), 'Présentiel')
    await user.type(
      screen.getByLabelText("Description de l'activité"),
      'Besoin de choristes supplémentaires.',
    )
    expect(screen.queryByLabelText('Département destinataire')).toBeNull()
    expect(screen.getByLabelText('Cette activité nécessite un budget')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: "Ajouter l'activité" }))
    expect(await screen.findByText('Répétition des bénévoles')).toBeTruthy()
    expect(screen.getByText(/chaque mardi · à 17 h 30 · présentiel/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Compte rendu' }))
    expect(await screen.findByLabelText('Présence de Pierre MWAMBA')).toBeTruthy()
    await user.type(
      screen.getByLabelText("Déroulement de l'activité"),
      'Préparation tenue, choeur complet.',
    )
    await user.click(screen.getByRole('button', { name: 'Enregistrer le compte rendu' }))
    expect(await screen.findByText('Préparation tenue, choeur complet.')).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: 'Budget' }))
    expect(screen.queryByText('Budget alloué')).toBeNull()
    expect(screen.getByRole('button', { name: 'Envoyer la demande' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Enregistrer la rentrée' })).toBeTruthy()
    expect(screen.getByText('Offrande du culte')).toBeTruthy()
    await user.type(screen.getByLabelText('Motif de la rentrée'), 'Concert de soutien')
    await user.type(screen.getByLabelText('Montant de la rentrée'), '75')
    await user.click(screen.getByRole('button', { name: 'Enregistrer la rentrée' }))
    expect(await screen.findByText('Concert de soutien')).toBeTruthy()
    await user.type(screen.getByLabelText('Motif de la dépense'), 'Partitions')
    await user.type(screen.getByLabelText('Montant de la dépense'), '45')
    await user.click(screen.getByRole('button', { name: 'Envoyer la demande' }))
    expect(await screen.findByText('Partitions')).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: 'Rapports' }))
    expect(await screen.findByText("Rentrée d'argent : Concert de soutien")).toBeTruthy()
    expect(await screen.findByText(/75,00 \$US enregistrés dans la caisse du département \(Département Louange\)/)).toBeTruthy()
    expect(screen.queryByText('Objectifs et écarts')).toBeNull()
    expect(screen.queryByRole('button', { name: "Créer le plan d'action" })).toBeNull()
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

    expect(await screen.findByRole('heading', { name: /Bonjour Daniel/ }, { timeout: 8000 })).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Départements' })).toBeTruthy()
    expect(await screen.findByText('ACCUEIL')).toBeTruthy()
    expect(screen.getByText('LOUANGE')).toBeTruthy()
    expect(screen.queryByText('DIAKONIE')).toBeNull()
    expect(screen.queryByRole('button', { name: /Désigner le superviseur/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Désigner le chef/ })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    expect(screen.getAllByRole('link', { name: 'Tous les départements' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Département Accueil' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Département Louange' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: 'Département Diaconie' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Personnes' })).toBeNull()
  })

  it('laisse le DGE désigner un superviseur depuis le catalogue', async () => {
    const { user } = renderApp()

    await seConnecter(user, 'dge@eglise.org', 'Dge2026!')
    await screen.findByRole('heading', { name: /Bonjour Esther/ }, { timeout: 8000 })
    await ouvrirDepartements(user)

    expect(await screen.findByRole('heading', { name: 'Départements' })).toBeTruthy()
    expect(await screen.findByRole('tab', { name: 'Tableau de bord' })).toBeTruthy()
    expect(await screen.findByRole('tab', { name: 'Suivi DGE' })).toBeTruthy()
    expect(await screen.findByRole('tab', { name: 'Rapports reçus' })).toBeTruthy()
    expect(screen.queryByText('Compte rendu août')).toBeNull()
    expect(await screen.findByText('DIAKONIE')).toBeTruthy()

    await user.click(screen.getAllByRole('tab', { name: 'Rapports reçus' })[0]!)
    expect(await screen.findByText('Compte rendu août')).toBeTruthy()
    await user.click(screen.getAllByRole('tab', { name: 'Tableau de bord' })[0]!)
    expect(await screen.findByText('DIAKONIE')).toBeTruthy()
    expect(await screen.findByRole('button', { name: 'Désigner le chef de Département Accueil' })).toBeTruthy()

    await user.click(
      await screen.findByRole('button', { name: 'Désigner le superviseur de Département Diaconie' }),
    )
    await user.click(await screen.findByRole('button', { name: 'Désigner Patrick MWAMBA comme superviseur' }))
    expect(await screen.findByText(/compte superviseur/)).toBeTruthy()
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Superviseur de/ })).toBeNull()
      expect(screen.getAllByText('Patrick MWAMBA').length).toBeGreaterThan(0)
    })
  })

  it('laisse le DGE envoyer une demande à un département', async () => {
    const { user } = renderApp()

    await seConnecter(user, 'dge@eglise.org', 'Dge2026!')
    await screen.findByRole('heading', { name: /Bonjour Esther/ }, { timeout: 8000 })
    await ouvrirDepartements(user)
    await user.click(screen.getAllByRole('link', { name: 'Suivi DGE' })[0]!)

    await user.type(screen.getByLabelText('Titre de la demande au département'), 'Bilan du trimestre')
    await user.type(
      screen.getByLabelText('Description de la demande au département'),
      'Merci de transmettre le rapport d’activités.',
    )
    await user.selectOptions(
      screen.getByLabelText('Département destinataire de la demande'),
      'Département Louange',
    )
    await user.click(screen.getByRole('button', { name: 'Envoyer la demande' }))
    expect(await screen.findByText('Bilan du trimestre')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    await user.click(screen.getAllByRole('button', { name: 'Déconnexion' }).at(-1)!)
    expect(await screen.findByRole('heading', { name: 'Connexion' }, { timeout: 8000 })).toBeTruthy()

    await seConnecter(user, 'chef-louange@eglise.org', 'ChefDep2026!')
    await user.click(await screen.findByRole('button', { name: 'Ouvrir le menu' }, { timeout: 8000 }))
    await user.click(screen.getByRole('link', { name: /Notifications/ }))
    expect(await screen.findByText('Bilan du trimestre')).toBeTruthy()
    expect(await screen.findByText('Demande du DGE')).toBeTruthy()
  }, 25000)
})
