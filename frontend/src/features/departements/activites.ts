export type ActiviteStatut = 'planifiee' | 'faite'

export type Activite = {
  id: string
  titre: string
  date: string
  description: string
  statut: ActiviteStatut
  idResponsable?: string
  nomResponsable?: string
  echeance?: string
}

export type ActiviteDepartement = Activite

/** Store local d'activités par entité (département, famille d'impact…), en attendant l'API. */
export function createActivitesStore(initiales: Record<string, Activite[]>) {
  function cloneSeed() {
    const copy: Record<string, Activite[]> = {}
    for (const [id, items] of Object.entries(initiales)) {
      copy[id] = items.map((item) => ({ ...item }))
    }
    return copy
  }

  let activites: Record<string, Activite[]> = cloneSeed()
  const listeners = new Set<() => void>()
  let version = 0

  function emit() {
    version += 1
    listeners.forEach((listener) => listener())
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    getVersion() {
      return version
    },

    list(ownerId: string) {
      return [...(activites[ownerId] ?? [])].sort((left, right) => right.date.localeCompare(left.date))
    },

    listAll() {
      return Object.entries(activites).flatMap(([ownerId, items]) =>
        items.map((item) => ({ ...item, ownerId })),
      )
    },

    add(ownerId: string, input: Omit<Activite, 'id' | 'statut'> & { statut?: ActiviteStatut }) {
      const created: Activite = {
        id: crypto.randomUUID(),
        titre: input.titre.trim(),
        date: input.date,
        description: input.description.trim(),
        statut: input.statut ?? 'planifiee',
        idResponsable: input.idResponsable,
        nomResponsable: input.nomResponsable?.trim() || undefined,
        echeance: input.echeance || undefined,
      }
      activites[ownerId] = [created, ...(activites[ownerId] ?? [])]
      emit()
      return created
    },

    update(ownerId: string, activiteId: string, input: Partial<Omit<Activite, 'id'>>) {
      const found = (activites[ownerId] ?? []).find((item) => item.id === activiteId)
      if (!found) return
      if (input.titre !== undefined) found.titre = input.titre.trim()
      if (input.date !== undefined) found.date = input.date
      if (input.description !== undefined) found.description = input.description.trim()
      if (input.statut !== undefined) found.statut = input.statut
      if (input.idResponsable !== undefined) found.idResponsable = input.idResponsable || undefined
      if (input.nomResponsable !== undefined) {
        found.nomResponsable = input.nomResponsable.trim() || undefined
      }
      if (input.echeance !== undefined) found.echeance = input.echeance || undefined
      emit()
      return found
    },

    marquerFaite(ownerId: string, activiteId: string) {
      const found = (activites[ownerId] ?? []).find((item) => item.id === activiteId)
      if (found) found.statut = 'faite'
      emit()
    },

    remove(ownerId: string, activiteId: string) {
      activites[ownerId] = (activites[ownerId] ?? []).filter((item) => item.id !== activiteId)
      emit()
    },

    reset() {
      activites = cloneSeed()
      emit()
    },
  }
}

const ACCUEIL_ID = 'd4f6b8c0-0006-4000-8000-000000000001'
const LOUANGE_ID = 'd4f6b8c0-0006-4000-8000-000000000002'

const store = createActivitesStore({
  [ACCUEIL_ID]: [
    {
      id: 'act-accueil-1',
      titre: 'Réunion de coordination',
      date: '2026-04-18',
      description: 'Préparation des équipes du dimanche.',
      statut: 'faite',
    },
    {
      id: 'act-accueil-2',
      titre: 'Formation des hôtes',
      date: '2026-06-12',
      description: '',
      statut: 'faite',
    },
    {
      id: 'act-accueil-3',
      titre: 'Briefing de rentrée',
      date: '2026-09-14',
      description: '',
      statut: 'planifiee',
    },
  ],
  [LOUANGE_ID]: [
    {
      id: 'act-louange-1',
      titre: 'Répétition générale',
      date: '2026-05-03',
      description: '',
      statut: 'faite',
    },
    {
      id: 'act-louange-2',
      titre: 'Préparation du culte',
      date: '2026-09-07',
      description: '',
      statut: 'planifiee',
      idResponsable: 'b2d4f6a8-0004-4000-8000-000000000007',
      nomResponsable: 'Pierre MWAMBA',
      echeance: '2026-09-06',
    },
  ],
})

export const subscribeActivites = store.subscribe
export const getActivitesVersion = store.getVersion
export const listActivites = store.list
export const addActivite = store.add
export const updateActivite = store.update
export const marquerActiviteFaite = store.marquerFaite
export const deleteActivite = store.remove
export const resetActivites = store.reset

export function listAllActivites() {
  return store.listAll().map(({ ownerId, ...item }) => ({ ...item, idDepartement: ownerId }))
}
