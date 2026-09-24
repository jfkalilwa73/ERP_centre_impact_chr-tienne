import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderApp, seConnecter } from '@/test/renderApp'

describe('écran Personnes', () => {
  it('mène à la liste depuis le menu, puis permet d’en créer une', async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    await user.click(screen.getByRole('link', { name: 'Personnes' }))

    expect(await screen.findByRole('heading', { name: 'Personnes' })).toBeTruthy()
    expect(await screen.findByText('Total Personnes')).toBeTruthy()
    expect(await screen.findByText('Membres Actifs')).toBeTruthy()
    expect(await screen.findByText('Nouvelles Inscriptions (Mois)')).toBeTruthy()
    expect(await screen.findByText('Qualité des Données')).toBeTruthy()
    expect(await screen.findByRole('progressbar', { name: 'Qualité des données' })).toBeTruthy()
    expect(await screen.findByRole('link', { name: 'Jean KABILA' })).toBeTruthy()
    expect(screen.queryByText('ID membre')).toBeNull()
    expect(await screen.findByText("Famille d'impact")).toBeTruthy()
    expect((await screen.findAllByText('Bâtisseurs (Nord)')).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Modifier Jean KABILA' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Supprimer Jean KABILA' })).toBeNull()

    expect(await screen.findByRole('status')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Voir les doublons' }))
    expect(await screen.findByRole('heading', { name: 'Profils à vérifier' })).toBeTruthy()
    expect(screen.getAllByText('Pierre MWAMBA').length).toBeGreaterThan(1)
    await user.click(screen.getByRole('button', { name: 'Fermer' }))

    await user.selectOptions(screen.getByLabelText('Filtrer par famille d\'impact'), 'Bâtisseurs (Nord)')
    expect(screen.getByRole('link', { name: 'Jean KABILA' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Paul KALONJI' })).toBeNull()

    await user.selectOptions(screen.getByLabelText('Filtrer par famille d\'impact'), "Toutes les familles d'impact")
    expect((await screen.findAllByText('Département Accueil')).length).toBeGreaterThan(0)
    await user.selectOptions(screen.getByLabelText('Filtrer par département'), 'Département Accueil')
    expect(screen.getByRole('link', { name: 'Jean KABILA' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Paul KALONJI' })).toBeNull()
    await user.selectOptions(screen.getByLabelText('Filtrer par département'), 'Tous les départements')

    await user.click(screen.getByRole('button', { name: 'Nouvelle personne' }))
    await user.type(screen.getByLabelText('Nom'), 'KASONGO')
    await user.type(screen.getByLabelText('Prénom'), 'Esther')
    await user.click(screen.getByRole('button', { name: 'Créer la personne' }))

    expect(await screen.findByRole('link', { name: 'Esther KASONGO' }, { timeout: 8000 })).toBeTruthy()
  })

  it('ouvre la fiche et permet d’affecter à un département', async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    await user.click(screen.getByRole('link', { name: 'Personnes' }))
    await user.click(await screen.findByRole('link', { name: 'Paul KALONJI' }))

    expect(await screen.findByRole('heading', { name: 'Paul KALONJI' })).toBeTruthy()
    expect(await screen.findByRole('button', { name: 'Importer une photo de profil' })).toBeTruthy()
    expect(document.querySelector('section img[alt="Impact Centre Chrétien"]')).toBeNull()
    expect(await screen.findByRole('link', { name: 'Retour aux personnes' })).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Coordonnées' })).toBeTruthy()
    expect(await screen.findByText('Qualité de la fiche')).toBeTruthy()
    expect(screen.queryByText("Contact d'urgence")).toBeNull()

    await user.click(screen.getByRole('tab', { name: 'Liens Familiaux' }))
    expect(await screen.findByText('Personnes existantes')).toBeTruthy()
    expect(await screen.findByRole('columnheader', { name: 'Identité' })).toBeTruthy()
    expect(await screen.findByLabelText('Lien familial avec Jean KABILA')).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: 'Historique' }))
    expect(await screen.findByText('Création de la fiche')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Modifier' }))
    expect(await screen.findByRole('heading', { name: 'Modifier la personne' })).toBeTruthy()
    expect(screen.getByLabelText('Statut civil')).toBeTruthy()
    expect(screen.getAllByLabelText("Famille d'impact").length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Fichier PDF')).toBeTruthy()
    expect(screen.getByLabelText('Formation 001')).toBeTruthy()
    expect(screen.getByLabelText('Formation 101')).toBeTruthy()
    expect(screen.getByLabelText('Formation 201')).toBeTruthy()
    expect(screen.queryByLabelText("Contact d'urgence")).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Fermer' }))

    await user.click(screen.getByRole('tab', { name: 'Responsabilités & Ministères' }))
    await user.click(screen.getByRole('button', { name: 'Affecter' }))
    expect(await screen.findByRole('option', { name: /Louange/ })).toBeTruthy()
    await user.selectOptions(
      screen.getByLabelText('Département'),
      screen.getByRole('option', { name: /Louange/ }),
    )
    await user.selectOptions(screen.getByLabelText('Rôle'), 'Chef')
    await user.click(screen.getByRole('button', { name: "Enregistrer l'affectation" }))

    expect(await screen.findAllByText('Chef')).not.toHaveLength(0)
    expect(await screen.findByRole('button', { name: 'Retirer' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Clôturer' })).toBeNull()
  })

  it('laisse consulter sans proposer de création à un compte lecture seule', async () => {
    const { user } = renderApp()

    await seConnecter(user, 'accueil@eglise.org', 'Accueil2026!')
    await screen.findByRole('heading', { name: /Bonjour Grâce/ })

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    await user.click(screen.getByRole('link', { name: 'Personnes' }))

    expect(await screen.findByRole('heading', { name: 'Personnes' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Nouvelle personne' })).toBeNull()
  })

  it('permet de compléter la fiche, changer de famille d’impact et supprimer une note', async () => {
    const { user } = renderApp()

    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    await user.click(screen.getByRole('link', { name: 'Personnes' }))
    await user.click(await screen.findByRole('link', { name: 'Jean KABILA' }))

    expect(await screen.findByText(/très impliqué dans l'accueil/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Supprimer la note' }))
    expect(screen.queryByText(/très impliqué dans l'accueil/)).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Modifier' }))
    await user.selectOptions(screen.getByLabelText('Statut civil'), 'Marié(e)')
    await user.type(screen.getByLabelText('Compétences / Professions'), 'Accueil')
    await user.selectOptions(screen.getByLabelText("Famille d'impact"), 'Lumières (Sud)')
    await user.click(screen.getByLabelText('Formation 001'))
    await user.click(screen.getByLabelText('Formation 101'))
    await user.click(screen.getByLabelText('Formation 201'))
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(await screen.findByText('Marié(e)')).toBeTruthy()
    expect(await screen.findByText('Lumières (Sud)', {}, { timeout: 8000 })).toBeTruthy()
    expect((await screen.findAllByText('Obtenue')).length).toBeGreaterThanOrEqual(3)

    await user.click(screen.getByRole('tab', { name: 'Liens Familiaux' }))
    await user.selectOptions(screen.getByLabelText('Lien familial avec Grâce MUKENDI'), 'Conjoint')
    await user.click(screen.getByRole('tab', { name: 'Historique' }))
    expect(await screen.findByText(/Lien familial ajouté : Grâce MUKENDI/)).toBeTruthy()
    expect(await screen.findByText('Modification des informations générales')).toBeTruthy()
  })

  it('importe une photo sur la fiche, la montre dans le tableau, et ouvre un PDF rempli', async () => {
    const written: string[] = []
    const popup = {
      document: {
        open: vi.fn(),
        write: (html: string) => {
          written.push(html)
        },
        close: vi.fn(),
        images: [] as HTMLImageElement[],
      },
      focus: vi.fn(),
      print: vi.fn(),
      close: vi.fn(),
      setTimeout: (callback: () => void) => {
        callback()
        return 0
      },
      addEventListener: vi.fn(),
    }
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)

    const { user } = renderApp()
    await seConnecter(user)
    await screen.findByRole('heading', { name: /Bonjour Jean/ })
    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    await user.click(screen.getByRole('link', { name: 'Personnes' }))
    await user.click(await screen.findByRole('link', { name: 'Jean KABILA' }))
    await screen.findByRole('button', { name: 'Importer une photo de profil' })

    const png = Uint8Array.from(
      atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='),
      (char) => char.charCodeAt(0),
    )
    await user.upload(
      screen.getByLabelText('Fichier photo de profil'),
      new File([png], 'jean.png', { type: 'image/png' }),
    )

    expect(await screen.findByRole('img', { name: 'Jean KABILA' })).toBeTruthy()

    try {
      await user.click(screen.getByRole('button', { name: 'Exporter PDF' }))
      expect(written[0]).toContain('Jean KABILA')
      expect(written[0]).toContain('Coordonnées')
      expect(written[0]).toContain('data:image/png')
      expect(popup.print).toHaveBeenCalled()

      await user.click(screen.getByRole('link', { name: 'Retour aux personnes' }))
      expect(await screen.findByRole('heading', { name: 'Personnes' })).toBeTruthy()
      expect(await screen.findByRole('img', { name: 'Jean KABILA' })).toBeTruthy()
    } finally {
      vi.mocked(window.open).mockRestore()
    }
  })
})
