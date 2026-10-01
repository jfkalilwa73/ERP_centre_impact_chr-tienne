import { clampText, canMutateUnite, isValidMontant } from '@/lib/writeAccess'
import { PERMISSIONS } from '@/lib/permissions'

export type DepenseStatut = 'demandee' | 'validee' | 'refusee'
export type SourceCaisse = 'departement' | 'eglise'

export const CAISSE_EGLISE = {
  idDepartement: 'd4f6b8c0-0006-4000-8000-000000000004',
  nom: "Caisse de l'église",
}

export type Depense = {
  id: string
  motif: string
  montant: number
  statut: DepenseStatut
  date: string
  source: SourceCaisse
  idActivite?: string
}

export type Rentree = {
  id: string
  motif: string
  montant: number
  date: string
}

type Enveloppe = {
  alloue: number
}

const ACCUEIL_ID = 'd4f6b8c0-0006-4000-8000-000000000001'
const LOUANGE_ID = 'd4f6b8c0-0006-4000-8000-000000000002'
const BATISSEURS_ID = 'f1a2b3c4-0008-4000-8000-000000000001'
const LUMIERES_ID = 'f1a2b3c4-0008-4000-8000-000000000002'

const seedEnveloppes: Record<string, Enveloppe> = {
  [ACCUEIL_ID]: { alloue: 800 },
  [LOUANGE_ID]: { alloue: 1500 },
  [BATISSEURS_ID]: { alloue: 400 },
  [LUMIERES_ID]: { alloue: 350 },
  [CAISSE_EGLISE.idDepartement]: { alloue: 25000 },
}

const seedDepenses: Record<string, Depense[]> = {
  [LOUANGE_ID]: [
    {
      id: 'dep-louange-1',
      motif: 'Cordes et médiators',
      montant: 120,
      statut: 'validee',
      date: '2026-08-12',
      source: 'departement',
    },
    {
      id: 'dep-louange-2',
      motif: 'Location de pupitres',
      montant: 80,
      statut: 'demandee',
      date: '2026-09-18',
      source: 'departement',
    },
  ],
}

const seedRentrees: Record<string, Rentree[]> = {
  [LOUANGE_ID]: [
    {
      id: 'ren-louange-1',
      motif: 'Offrande du culte',
      montant: 200,
      date: '2026-08-01',
    },
  ],
  [BATISSEURS_ID]: [
    {
      id: 'ren-batisseurs-1',
      motif: 'Cotisations de cellule',
      montant: 80,
      date: '2026-08-20',
    },
  ],
}

function cloneEnveloppes() {
  return Object.fromEntries(Object.entries(seedEnveloppes).map(([id, item]) => [id, { ...item }]))
}

function cloneDepenses() {
  return Object.fromEntries(
    Object.entries(seedDepenses).map(([id, items]) => [id, items.map((item) => ({ ...item }))]),
  )
}

function cloneRentrees() {
  return Object.fromEntries(
    Object.entries(seedRentrees).map(([id, items]) => [id, items.map((item) => ({ ...item }))]),
  )
}

let enveloppes = cloneEnveloppes()
let depenses = cloneDepenses()
let rentreesParUnite = cloneRentrees()
const listeners = new Set<() => void>()
let version = 0

function emit() {
  version += 1
  listeners.forEach((listener) => listener())
}

export function subscribeBudget(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getBudgetVersion() {
  return version
}

export function getEnveloppe(departementId: string) {
  return enveloppes[departementId] ?? { alloue: 0 }
}

export function listBudgetDepartementIds() {
  return [
    ...new Set([...Object.keys(enveloppes), ...Object.keys(depenses), ...Object.keys(rentreesParUnite)]),
  ]
}

export function listDepenses(departementId: string) {
  return [...(depenses[departementId] ?? [])].sort((left, right) => right.date.localeCompare(left.date))
}

export function listRentrees(departementId: string) {
  return [...(rentreesParUnite[departementId] ?? [])].sort((left, right) =>
    right.date.localeCompare(left.date),
  )
}

export function syntheseBudget(departementId: string) {
  const alloue = getEnveloppe(departementId).alloue
  const rentrees = listRentrees(departementId).reduce((sum, item) => sum + item.montant, 0)
  const items = listDepenses(departementId).filter((item) => item.source !== 'eglise')
  const engage = items
    .filter((item) => item.statut === 'demandee' || item.statut === 'validee')
    .reduce((sum, item) => sum + item.montant, 0)
  const depense = items
    .filter((item) => item.statut === 'validee')
    .reduce((sum, item) => sum + item.montant, 0)
  return {
    alloue,
    rentrees,
    engage,
    depense,
    disponible: Math.max(0, alloue + rentrees - engage),
  }
}

export function demanderDepense(
  departementId: string,
  input: { motif: string; montant: number; source?: SourceCaisse; idActivite?: string },
) {
  if (!canMutateUnite(departementId, [PERMISSIONS.BUDGET_REQUEST])) return undefined
  if (!isValidMontant(input.montant)) return undefined
  const motif = clampText(input.motif)
  if (!motif) return undefined

  const source = input.source ?? 'departement'
  if (source === 'departement' && input.montant > syntheseBudget(departementId).disponible) {
    return undefined
  }

  const created: Depense = {
    id: crypto.randomUUID(),
    motif,
    montant: input.montant,
    statut: source === 'departement' ? 'validee' : 'demandee',
    date: new Date().toISOString().slice(0, 10),
    source,
    idActivite: input.idActivite,
  }
  depenses[departementId] = [created, ...(depenses[departementId] ?? [])]
  emit()
  return created
}

export function enregistrerRentree(
  departementId: string,
  input: { motif: string; montant: number; date?: string },
) {
  if (!canMutateUnite(departementId, [PERMISSIONS.BUDGET_REQUEST])) return undefined
  if (!isValidMontant(input.montant)) return undefined
  const motif = clampText(input.motif)
  if (!motif) return undefined

  const created: Rentree = {
    id: crypto.randomUUID(),
    motif,
    montant: input.montant,
    date: input.date ?? new Date().toISOString().slice(0, 10),
  }
  rentreesParUnite[departementId] = [created, ...(rentreesParUnite[departementId] ?? [])]
  emit()
  return created
}

export function resetBudget() {
  enveloppes = cloneEnveloppes()
  depenses = cloneDepenses()
  rentreesParUnite = cloneRentrees()
  emit()
}

export function statutDepenseLabel(statut: DepenseStatut) {
  if (statut === 'validee') return 'Validée'
  if (statut === 'refusee') return 'Refusée'
  return 'Demandée'
}

export function sourceCaisseLabel(source: SourceCaisse) {
  return source === 'eglise' ? CAISSE_EGLISE.nom : 'Caisse du département'
}

export function formatMontant(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value)
}
