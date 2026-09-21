export type ActiviteStatut = 'planifiee' | 'faite'

export type ActiviteDepartement = {
  id: string
  titre: string
  date: string
  description: string
  statut: ActiviteStatut
}

const ACCUEIL_ID = 'd4f6b8c0-0006-4000-8000-000000000001'
const LOUANGE_ID = 'd4f6b8c0-0006-4000-8000-000000000002'

const activitesInitiales: Record<string, ActiviteDepartement[]> = {
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
    },
  ],
}

function cloneSeed() {
  const copy: Record<string, ActiviteDepartement[]> = {}
  for (const [id, items] of Object.entries(activitesInitiales)) {
    copy[id] = items.map((item) => ({ ...item }))
  }
  return copy
}

let activites: Record<string, ActiviteDepartement[]> = cloneSeed()
const listeners = new Set<() => void>()
let version = 0

function emit() {
  version += 1
  listeners.forEach((listener) => listener())
}

export function subscribeActivites(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getActivitesVersion() {
  return version
}

export function listActivites(departementId: string) {
  return [...(activites[departementId] ?? [])].sort((left, right) => right.date.localeCompare(left.date))
}

export function listAllActivites() {
  return Object.entries(activites).flatMap(([idDepartement, items]) =>
    items.map((item) => ({ ...item, idDepartement })),
  )
}

export function addActivite(
  departementId: string,
  input: Omit<ActiviteDepartement, 'id' | 'statut'> & { statut?: ActiviteStatut },
) {
  const created: ActiviteDepartement = {
    id: crypto.randomUUID(),
    titre: input.titre.trim(),
    date: input.date,
    description: input.description.trim(),
    statut: input.statut ?? 'planifiee',
  }
  activites[departementId] = [created, ...(activites[departementId] ?? [])]
  emit()
  return created
}

export function marquerActiviteFaite(departementId: string, activiteId: string) {
  const items = activites[departementId] ?? []
  const found = items.find((item) => item.id === activiteId)
  if (found) found.statut = 'faite'
  emit()
}

export function deleteActivite(departementId: string, activiteId: string) {
  activites[departementId] = (activites[departementId] ?? []).filter((item) => item.id !== activiteId)
  emit()
}

export function resetActivites() {
  activites = cloneSeed()
  emit()
}
