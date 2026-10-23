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
      concerne: 'equipe',
      recurrence: 'unique',
      compteRendu: {
        date: '2026-04-20',
        deroulement: 'Partage tenu, trois foyers visités.',
        presence: [
          { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000001', nom: 'Jean KABILA', present: true },
          { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000006', nom: 'Ruth NGOY', present: true },
          { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000007', nom: 'Pierre MWAMBA', present: true },
          { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000008', nom: 'Pierre MWAMBA', present: false },
        ],
      },
    },
    {
      id: 'act-batisseurs-2',
      titre: 'Visite de quartier',
      date: '2026-06-15',
      description: '',
      statut: 'faite',
      concerne: 'tous',
      recurrence: 'unique',
      compteRendu: {
        date: '2026-06-15',
        deroulement: 'Visite du quartier Nord.',
        presence: [
          { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000001', nom: 'Jean KABILA', present: true },
          { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000006', nom: 'Ruth NGOY', present: true },
          { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000007', nom: 'Pierre MWAMBA', present: false },
          { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000008', nom: 'Pierre MWAMBA', present: false },
        ],
      },
    },
    {
      id: 'act-batisseurs-priere',
      titre: 'Prière de famille',
      date: '2026-09-10',
      description: 'Temps de prière ouvert à toute la famille.',
      statut: 'planifiee',
      concerne: 'priere',
      recurrence: 'constante',
      jours: [3],
      heure: '19:30',
      modalite: 'presentiel',
    },
    {
      id: 'act-batisseurs-3',
      titre: 'Soirée d’intégration',
      date: '2026-09-12',
      description: '',
      statut: 'planifiee',
      concerne: 'equipe',
      recurrence: 'unique',
      idResponsable: 'b2d4f6a8-0004-4000-8000-000000000006',
      nomResponsable: 'Ruth NGOY',
      echeance: '2026-09-12',
    },
  ],
  [LUMIERES_ID]: [
    {
      id: 'act-lumieres-1',
      titre: 'Réunion de famille',
      date: '2026-05-10',
      description: '',
      statut: 'faite',
      concerne: 'equipe',
      recurrence: 'unique',
      compteRendu: {
        date: '2026-05-10',
        deroulement: 'Réunion tenue au Sud.',
        presence: [
          { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000002', nom: 'Grâce MUKENDI', present: true },
          { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000004', nom: 'Marie TSHISEKEDI', present: true },
        ],
      },
    },
    {
      id: 'act-lumieres-2',
      titre: 'Sortie mission',
      date: '2026-09-05',
      description: '',
      statut: 'planifiee',
      concerne: 'tous',
      recurrence: 'unique',
    },
  ],
})

export const subscribeActivitesFamille = store.subscribe
export const getActivitesFamilleVersion = store.getVersion
export const listActivitesFamille = store.list
export const addActiviteFamille = store.add
export const updateActiviteFamille = store.update
export const marquerActiviteFamilleFaite = store.marquerFaite
export const enregistrerCompteRenduFamille = store.enregistrerCompteRendu
export const deleteActiviteFamille = store.remove
export const snapshotActivitesFamille = store.snapshot
export const replaceActivitesFamille = store.replace
export const resetActivitesFamille = store.reset

export const activitesFamilleApi = {
  add: store.add,
  update: store.update,
  remove: store.remove,
  enregistrerCompteRendu: store.enregistrerCompteRendu,
}

export function listAllActivitesFamille() {
  return store.listAll().map(({ ownerId, ...item }) => ({ ...item, idFamille: ownerId }))
}
