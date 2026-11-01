import { canSeePilotageDge, isAdminFonctionnel } from '@/features/auth/orgRoles'
import {
  clampText,
  canMutateUnite,
  currentUser,
  isTestBypass,
  leadsUnite,
  MAX_DESCRIPTION,
} from '@/lib/writeAccess'
import { PERMISSIONS } from '@/lib/permissions'

export type CirculationKind =
  | 'rapport'
  | 'budget'
  | 'activite'
  | 'alerte'
  | 'rappel'
  | 'compte_rendu'
  | 'demande'

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
  if (kind === 'compte_rendu') return 'Compte rendu demandé'
  if (kind === 'demande') return 'Demande du DGE'
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

function canCreateCirculation(input: CirculationInput) {
  if (isTestBypass()) return true
  const user = currentUser()
  if (!user) return false
  if (input.idAuteur !== user.personne.idPersonne) return false
  if (input.kind === 'alerte' || input.kind === 'compte_rendu') return false
  if (input.kind === 'demande') return canSeePilotageDge(user)
  const needed =
    input.kind === 'budget'
      ? [PERMISSIONS.BUDGET_REQUEST]
      : input.kind === 'rapport'
        ? [PERMISSIONS.RAPPORTS_CREATE, PERMISSIONS.BUDGET_REQUEST]
        : [PERMISSIONS.ACTIVITES_CREATE, PERMISSIONS.ACTIVITES_UPDATE, PERMISSIONS.DEMANDES_CREATE]
  return canMutateUnite(input.idDepartementSource, needed)
}

function toCirculation(input: CirculationInput): Circulation {
  return {
    id: crypto.randomUUID(),
    ...input,
    titre: clampText(input.titre),
    description: clampText(input.description, MAX_DESCRIPTION),
    dateCreation: new Date().toISOString(),
    reponses: [],
    luPar: [input.idAuteur],
    idPersonnesNotifiees: input.idPersonnesNotifiees?.length
      ? [...input.idPersonnesNotifiees]
      : undefined,
  }
}

export function createCirculation(input: CirculationInput) {
  if (!canCreateCirculation(input)) return undefined
  const created = toCirculation(input)
  circulations = [created, ...circulations]
  emit()
  return created
}

export function upsertCirculation(input: CirculationInput) {
  if (!canCreateCirculation(input)) return undefined
  if (input.sourceKey) {
    const found = circulations.find((item) => item.sourceKey === input.sourceKey)
    if (found) {
      found.kind = input.kind
      found.titre = clampText(input.titre)
      found.description = clampText(input.description, MAX_DESCRIPTION)
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
  isDge?: boolean
  superviseurDepartementIds: string[]
  chefDepartementIds: string[]
}) {
  return listCirculations().filter((item) => {
    if (input.isAdmin || input.isPasteur || input.isDge) return true
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
  if (item.kind === 'alerte' || item.kind === 'rappel' || item.kind === 'compte_rendu') return false
  return chefDepartementIds.includes(item.idDepartementCible)
}

export function repondreCirculation(
  id: string,
  input: { texte: string; idAuteur: string; nomAuteur: string },
  chefDepartementIds: string[],
) {
  const found = circulations.find((item) => item.id === id)
  if (!found || !canReplyCirculation(found, chefDepartementIds)) return false
  if (!isTestBypass()) {
    const user = currentUser()
    if (!user || input.idAuteur !== user.personne.idPersonne) return false
  }
  const texte = clampText(input.texte, MAX_DESCRIPTION)
  if (!texte) return false
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
  return true
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

function canDeleteCirculation(item: Circulation) {
  if (isTestBypass()) return true
  const user = currentUser()
  if (!user) return false
  if (isAdminFonctionnel(user) || canSeePilotageDge(user)) return true
  if (item.idAuteur === user.personne.idPersonne) return true
  return (
    leadsUnite(user.personne.idPersonne, item.idDepartementCible) ||
    leadsUnite(user.personne.idPersonne, item.idDepartementSource)
  )
}

export function deleteCirculation(id: string) {
  const found = circulations.find((item) => item.id === id)
  if (!found || !canDeleteCirculation(found)) return false
  if (found.sourceKey) dismissedKeys.add(found.sourceKey)
  circulations = circulations.filter((item) => item.id !== id)
  emit()
  return true
}

export function deleteCirculations(ids: string[]) {
  const allowed = ids.filter((id) => {
    const found = circulations.find((item) => item.id === id)
    return found ? canDeleteCirculation(found) : false
  })
  allowed.forEach((id) => {
    const found = circulations.find((item) => item.id === id)
    if (found?.sourceKey) dismissedKeys.add(found.sourceKey)
  })
  const remove = new Set(allowed)
  const next = circulations.filter((item) => !remove.has(item.id))
  if (next.length === circulations.length) return false
  circulations = next
  emit()
  return true
}

export function replaceAlertes(next: Circulation[]) {
  const currentKeys = new Set(next.map((item) => item.sourceKey).filter((key): key is string => Boolean(key)))
  dismissedKeys.forEach((key) => {
    if (!currentKeys.has(key)) dismissedKeys.delete(key)
  })
  const filtered = next.filter((item) => !item.sourceKey || !dismissedKeys.has(item.sourceKey))
  const derived = (item: Circulation) => item.kind === 'alerte' || item.kind === 'compte_rendu'
  const others = circulations.filter((item) => !derived(item))
  const previous = circulations.filter(derived)
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

export function snapshotCirculations() {
  return structuredClone(circulations)
}

export function replaceCirculations(next: Circulation[]) {
  circulations = structuredClone(next)
  emit()
}

export function resetCirculations() {
  circulations = []
  dismissedKeys = new Set()
  emit()
}
