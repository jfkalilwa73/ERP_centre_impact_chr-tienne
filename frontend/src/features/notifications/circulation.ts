export type CirculationKind = 'rapport' | 'budget' | 'activite' | 'alerte' | 'rappel'

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
  sourceKey?: string
  idPersonnesNotifiees?: string[]
}

const listeners = new Set<() => void>()
let version = 0
let circulations: Circulation[] = []
let dismissedKeys = new Set<string>()

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
  if (kind === 'alerte') return 'Alerte'
  if (kind === 'rappel') return 'Rappel aux membres'
  return 'Rapport'
}

type CirculationInput = {
  kind: CirculationKind
  titre: string
  description: string
  idDepartementSource: string
  nomDepartementSource: string
  idDepartementCible: string
  nomDepartementCible: string
  idAuteur: string
  nomAuteur: string
  sourceKey?: string
  idPersonnesNotifiees?: string[]
}

function toCirculation(input: CirculationInput): Circulation {
  return {
    id: crypto.randomUUID(),
    ...input,
    titre: input.titre.trim(),
    description: input.description.trim(),
    dateCreation: new Date().toISOString(),
    reponses: [],
    luPar: [input.idAuteur],
    idPersonnesNotifiees: input.idPersonnesNotifiees?.length
      ? [...input.idPersonnesNotifiees]
      : undefined,
  }
}

export function createCirculation(input: CirculationInput) {
  const created = toCirculation(input)
  circulations = [created, ...circulations]
  emit()
  return created
}

export function upsertCirculation(input: CirculationInput) {
  if (input.sourceKey) {
    const found = circulations.find((item) => item.sourceKey === input.sourceKey)
    if (found) {
      found.kind = input.kind
      found.titre = input.titre.trim()
      found.description = input.description.trim()
      found.idDepartementSource = input.idDepartementSource
      found.nomDepartementSource = input.nomDepartementSource
      found.idDepartementCible = input.idDepartementCible
      found.nomDepartementCible = input.nomDepartementCible
      found.idAuteur = input.idAuteur
      found.nomAuteur = input.nomAuteur
      found.idPersonnesNotifiees = input.idPersonnesNotifiees?.length
        ? [...input.idPersonnesNotifiees]
        : undefined
      found.dateCreation = new Date().toISOString()
      found.luPar = [input.idAuteur]
      emit()
      return found
    }
  }
  return createCirculation(input)
}

export function deleteCirculationsBySourceKey(sourceKey: string) {
  const ids = circulations.filter((item) => item.sourceKey === sourceKey).map((item) => item.id)
  if (ids.length) deleteCirculations(ids)
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
    if (input.idPersonne && item.idPersonnesNotifiees?.includes(input.idPersonne)) return true
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
  if (item.kind === 'alerte' || item.kind === 'rappel') return false
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

export function deleteCirculation(id: string) {
  const found = circulations.find((item) => item.id === id)
  if (!found) return
  if (found.sourceKey) dismissedKeys.add(found.sourceKey)
  circulations = circulations.filter((item) => item.id !== id)
  emit()
}

export function deleteCirculations(ids: string[]) {
  ids.forEach((id) => {
    const found = circulations.find((item) => item.id === id)
    if (found?.sourceKey) dismissedKeys.add(found.sourceKey)
  })
  const remove = new Set(ids)
  const next = circulations.filter((item) => !remove.has(item.id))
  if (next.length === circulations.length) return
  circulations = next
  emit()
}

export function replaceAlertes(next: Circulation[]) {
  const currentKeys = new Set(next.map((item) => item.sourceKey).filter((key): key is string => Boolean(key)))
  dismissedKeys.forEach((key) => {
    if (!currentKeys.has(key)) dismissedKeys.delete(key)
  })
  const filtered = next.filter((item) => !item.sourceKey || !dismissedKeys.has(item.sourceKey))
  const others = circulations.filter((item) => item.kind !== 'alerte')
  const previous = circulations.filter((item) => item.kind === 'alerte')
  const unchanged =
    previous.length === filtered.length &&
    filtered.every((item) => {
      const found = previous.find((alerte) => alerte.sourceKey === item.sourceKey)
      return Boolean(found && found.titre === item.titre && found.description === item.description)
    })
  if (unchanged) return

  const luPar = new Map(previous.map((item) => [item.sourceKey, item.luPar]))
  circulations = [
    ...filtered.map((item) => ({
      ...item,
      luPar: luPar.get(item.sourceKey) ?? item.luPar,
    })),
    ...others,
  ]
  emit()
}

export function resetCirculations() {
  circulations = []
  dismissedKeys = new Set()
  emit()
}
