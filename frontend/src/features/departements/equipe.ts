import { clampText, canMutateUnite } from '@/lib/writeAccess'
import { PERMISSIONS } from '@/lib/permissions'

export type Disponibilite = 'disponible' | 'partiel' | 'indisponible'

export type FicheEquipe = {
  idPersonne: string
  responsabilite: string
  disponibilite: Disponibilite
}

export type CreneauBenevole = {
  id: string
  date: string
  besoin: string
  idPersonne?: string
  nomPersonne?: string
}

const ACCUEIL_ID = 'd4f6b8c0-0006-4000-8000-000000000001'
const LOUANGE_ID = 'd4f6b8c0-0006-4000-8000-000000000002'

const seedFiches: Record<string, FicheEquipe[]> = {
  [ACCUEIL_ID]: [
    {
      idPersonne: 'b2d4f6a8-0004-4000-8000-00000000000a',
      responsabilite: 'Supervision des hospices',
      disponibilite: 'disponible',
    },
    {
      idPersonne: 'b2d4f6a8-0004-4000-8000-000000000001',
      responsabilite: 'Accueil porte principale',
      disponibilite: 'partiel',
    },
  ],
  [LOUANGE_ID]: [
    {
      idPersonne: 'b2d4f6a8-0004-4000-8000-00000000000a',
      responsabilite: 'Supervision musicale',
      disponibilite: 'disponible',
    },
    {
      idPersonne: 'b2d4f6a8-0004-4000-8000-000000000007',
      responsabilite: 'Direction de la louange',
      disponibilite: 'disponible',
    },
  ],
}

const seedCreneaux: Record<string, CreneauBenevole[]> = {
  [LOUANGE_ID]: [
    {
      id: 'ben-louange-1',
      date: '2026-09-27',
      besoin: 'Choeur du dimanche',
      idPersonne: 'b2d4f6a8-0004-4000-8000-000000000007',
      nomPersonne: 'Pierre MWAMBA',
    },
    {
      id: 'ben-louange-2',
      date: '2026-10-04',
      besoin: 'Régie son',
    },
  ],
}

function cloneFiches() {
  return Object.fromEntries(
    Object.entries(seedFiches).map(([id, items]) => [id, items.map((item) => ({ ...item }))]),
  )
}

function cloneCreneaux() {
  return Object.fromEntries(
    Object.entries(seedCreneaux).map(([id, items]) => [id, items.map((item) => ({ ...item }))]),
  )
}

let fiches = cloneFiches()
let creneaux = cloneCreneaux()
const listeners = new Set<() => void>()
let version = 0

function emit() {
  version += 1
  listeners.forEach((listener) => listener())
}

export function subscribeEquipe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getEquipeVersion() {
  return version
}

export function getFicheEquipe(departementId: string, idPersonne: string) {
  return (fiches[departementId] ?? []).find((item) => item.idPersonne === idPersonne)
}

export function upsertFicheEquipe(departementId: string, input: FicheEquipe) {
  if (!canMutateUnite(departementId, [PERMISSIONS.EQUIPES_MANAGE])) return
  const list = fiches[departementId] ?? []
  const found = list.find((item) => item.idPersonne === input.idPersonne)
  if (found) {
    found.responsabilite = clampText(input.responsabilite)
    found.disponibilite = input.disponibilite
  } else {
    fiches[departementId] = [...list, { ...input, responsabilite: clampText(input.responsabilite) }]
  }
  emit()
}

export function listCreneauxBenevoles(departementId: string) {
  return [...(creneaux[departementId] ?? [])].sort((left, right) => left.date.localeCompare(right.date))
}

export function addCreneauBenevole(
  departementId: string,
  input: Omit<CreneauBenevole, 'id'>,
) {
  if (!canMutateUnite(departementId, [PERMISSIONS.EQUIPES_MANAGE])) return undefined
  const created: CreneauBenevole = {
    id: crypto.randomUUID(),
    date: input.date,
    besoin: clampText(input.besoin),
    idPersonne: input.idPersonne || undefined,
    nomPersonne: input.nomPersonne?.trim() || undefined,
  }
  creneaux[departementId] = [created, ...(creneaux[departementId] ?? [])]
  emit()
  return created
}

export function assignCreneauBenevole(
  departementId: string,
  creneauId: string,
  input: { idPersonne?: string; nomPersonne?: string },
) {
  if (!canMutateUnite(departementId, [PERMISSIONS.EQUIPES_MANAGE])) return
  const found = (creneaux[departementId] ?? []).find((item) => item.id === creneauId)
  if (!found) return
  found.idPersonne = input.idPersonne || undefined
  found.nomPersonne = input.nomPersonne?.trim() || undefined
  emit()
}

export function deleteCreneauBenevole(departementId: string, creneauId: string) {
  if (!canMutateUnite(departementId, [PERMISSIONS.EQUIPES_MANAGE])) return
  creneaux[departementId] = (creneaux[departementId] ?? []).filter((item) => item.id !== creneauId)
  emit()
}

export function snapshotEquipe() {
  return structuredClone({ fiches, creneaux })
}

export function replaceEquipe(next: { fiches?: Record<string, FicheEquipe[]>; creneaux?: Record<string, CreneauBenevole[]> }) {
  fiches = structuredClone(next.fiches ?? {})
  creneaux = structuredClone(next.creneaux ?? {})
  emit()
}

export function resetEquipe() {
  fiches = cloneFiches()
  creneaux = cloneCreneaux()
  emit()
}

export function disponibiliteLabel(value: Disponibilite) {
  if (value === 'partiel') return 'Partielle'
  if (value === 'indisponible') return 'Indisponible'
  return 'Disponible'
}
