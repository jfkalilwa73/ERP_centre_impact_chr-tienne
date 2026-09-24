export type CirculationKind = 'rapport' | 'budget' | 'activite'

export type CirculationReponse = {
  id: string
  texte: string
  idAuteur: string
  nomAuteur: string
  date: string
}

export type Circulation = {
  id: string
  kind: CirculationKind
  titre: string
  description: string
  idDepartementSource: string
  nomDepartementSource: string
  idDepartementCible: string
  nomDepartementCible: string
  idAuteur: string
  nomAuteur: string
  dateCreation: string
  reponses: CirculationReponse[]
  luPar: string[]
}

const listeners = new Set<() => void>()
let version = 0
let circulations: Circulation[] = []

function emit() {
  version += 1
  listeners.forEach((listener) => listener())
}

export function subscribeCirculations(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getCirculationsVersion() {
  return version
}

export function kindLabel(kind: CirculationKind) {
  if (kind === 'budget') return 'Demande de budget'
  if (kind === 'activite') return 'Activité'
  return 'Rapport'
}

export function createCirculation(input: {
  kind: CirculationKind
  titre: string
  description: string
  idDepartementSource: string
  nomDepartementSource: string
  idDepartementCible: string
  nomDepartementCible: string
  idAuteur: string
  nomAuteur: string
}) {
  const created: Circulation = {
    id: crypto.randomUUID(),
    ...input,
    titre: input.titre.trim(),
    description: input.description.trim(),
    dateCreation: new Date().toISOString(),
    reponses: [],
    luPar: [input.idAuteur],
  }
  circulations = [created, ...circulations]
  emit()
  return created
}

export function listCirculations() {
  return [...circulations].sort((left, right) => right.dateCreation.localeCompare(left.dateCreation))
}

export function visibleCirculations(input: {
  idPersonne?: string
  isAdmin: boolean
  isPasteur: boolean
  superviseurDepartementIds: string[]
  chefDepartementIds: string[]
}) {
  return listCirculations().filter((item) => {
    if (input.isAdmin || input.isPasteur) return true
    if (item.idAuteur === input.idPersonne) return true
    if (input.chefDepartementIds.includes(item.idDepartementCible)) return true
    if (input.chefDepartementIds.includes(item.idDepartementSource)) return true
    return (
      input.superviseurDepartementIds.includes(item.idDepartementSource) ||
      input.superviseurDepartementIds.includes(item.idDepartementCible)
    )
  })
}

export function canReplyCirculation(item: Circulation, chefDepartementIds: string[]) {
  return chefDepartementIds.includes(item.idDepartementCible)
}

export function repondreCirculation(
  id: string,
  input: { texte: string; idAuteur: string; nomAuteur: string },
  chefDepartementIds: string[],
) {
  const found = circulations.find((item) => item.id === id)
  if (!found || !canReplyCirculation(found, chefDepartementIds)) return
  const texte = input.texte.trim()
  if (!texte) return
  found.reponses = [
    ...found.reponses,
    {
      id: crypto.randomUUID(),
      texte,
      idAuteur: input.idAuteur,
      nomAuteur: input.nomAuteur,
      date: new Date().toISOString(),
    },
  ]
  emit()
}

export function markCirculationsLues(idPersonne: string, items: Circulation[]) {
  items.forEach((item) => {
    if (!item.luPar.includes(idPersonne)) item.luPar = [...item.luPar, idPersonne]
  })
  emit()
}

export function unreadCirculationsCount(
  idPersonne: string,
  visible: Circulation[],
) {
  return visible.filter((item) => !item.luPar.includes(idPersonne)).length
}

export function resetCirculations() {
  circulations = []
  emit()
}
