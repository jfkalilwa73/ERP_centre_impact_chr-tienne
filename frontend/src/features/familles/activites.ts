import { createActivitesStore } from '@/features/departements/activites'

const BATISSEURS_ID = 'f1a2b3c4-0008-4000-8000-000000000001'
const LUMIERES_ID = 'f1a2b3c4-0008-4000-8000-000000000002'

const store = createActivitesStore({
  [BATISSEURS_ID]: [
    {
      id: 'act-batisseurs-1',
      titre: 'Cellule de maison',
      date: '2026-04-20',
      description: 'Partage et prière au Nord.',
      statut: 'faite',
    },
    {
      id: 'act-batisseurs-2',
      titre: 'Visite de quartier',
      date: '2026-06-15',
      description: '',
      statut: 'faite',
    },
    {
      id: 'act-batisseurs-3',
      titre: 'Soirée d’intégration',
      date: '2026-09-12',
      description: '',
      statut: 'planifiee',
    },
  ],
  [LUMIERES_ID]: [
    {
      id: 'act-lumieres-1',
      titre: 'Réunion de famille',
      date: '2026-05-10',
      description: '',
      statut: 'faite',
    },
    {
      id: 'act-lumieres-2',
      titre: 'Sortie mission',
      date: '2026-09-05',
      description: '',
      statut: 'planifiee',
    },
  ],
})

export const subscribeActivitesFamille = store.subscribe
export const getActivitesFamilleVersion = store.getVersion
export const listActivitesFamille = store.list
export const addActiviteFamille = store.add
export const marquerActiviteFamilleFaite = store.marquerFaite
export const deleteActiviteFamille = store.remove
export const resetActivitesFamille = store.reset

export function listAllActivitesFamille() {
  return store.listAll().map(({ ownerId, ...item }) => ({ ...item, idFamille: ownerId }))
}
