export type DepenseStatut = 'demandee' | 'validee' | 'refusee'

export type Depense = {
  id: string
  motif: string
  montant: number
  statut: DepenseStatut
  date: string
}

type Enveloppe = {
  alloue: number
}

const ACCUEIL_ID = 'd4f6b8c0-0006-4000-8000-000000000001'
const LOUANGE_ID = 'd4f6b8c0-0006-4000-8000-000000000002'

const seedEnveloppes: Record<string, Enveloppe> = {
  [ACCUEIL_ID]: { alloue: 800 },
  [LOUANGE_ID]: { alloue: 1500 },
}

const seedDepenses: Record<string, Depense[]> = {
  [LOUANGE_ID]: [
    {
      id: 'dep-louange-1',
      motif: 'Cordes et médiators',
      montant: 120,
      statut: 'validee',
      date: '2026-08-12',
    },
    {
      id: 'dep-louange-2',
      motif: 'Location de pupitres',
      montant: 80,
      statut: 'demandee',
      date: '2026-09-18',
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

let enveloppes = cloneEnveloppes()
let depenses = cloneDepenses()
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

export function listDepenses(departementId: string) {
  return [...(depenses[departementId] ?? [])].sort((left, right) => right.date.localeCompare(left.date))
}

export function syntheseBudget(departementId: string) {
  const alloue = getEnveloppe(departementId).alloue
  const items = listDepenses(departementId)
  const engage = items
    .filter((item) => item.statut === 'demandee' || item.statut === 'validee')
    .reduce((sum, item) => sum + item.montant, 0)
  const depense = items
    .filter((item) => item.statut === 'validee')
    .reduce((sum, item) => sum + item.montant, 0)
  return { alloue, engage, depense, disponible: Math.max(0, alloue - engage) }
}

export function demanderDepense(departementId: string, input: { motif: string; montant: number }) {
  const created: Depense = {
    id: crypto.randomUUID(),
    motif: input.motif.trim(),
    montant: input.montant,
    statut: 'demandee',
    date: new Date().toISOString().slice(0, 10),
  }
  depenses[departementId] = [created, ...(depenses[departementId] ?? [])]
  emit()
  return created
}

export function resetBudget() {
  enveloppes = cloneEnveloppes()
  depenses = cloneDepenses()
  emit()
}

export function statutDepenseLabel(statut: DepenseStatut) {
  if (statut === 'validee') return 'Validée'
  if (statut === 'refusee') return 'Refusée'
  return 'Demandée'
}

export function formatMontant(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value)
}
