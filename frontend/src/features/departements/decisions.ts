const ACCUEIL_ID = 'd4f6b8c0-0006-4000-8000-000000000001'
const LOUANGE_ID = 'd4f6b8c0-0006-4000-8000-000000000002'

export type DecisionStatut = 'en_cours' | 'executee' | 'en_retard' | 'bloquee'
export type DecisionInstance = 'DGE' | 'Conseil pastoral' | 'Supervision'

export type Decision = {
  id: string
  reference: string
  texte: string
  instance: DecisionInstance
  responsable: string
  echeance: string
  statut: DecisionStatut
  idDepartement?: string
}

const seedDecisions: Decision[] = [
  {
    id: 'dec-dge-1',
    reference: 'DGE-2026-04',
    texte: 'Valider le budget de rentrée de tous les départements.',
    instance: 'DGE',
    responsable: 'Esther KALALA',
    echeance: '2026-09-01',
    statut: 'executee',
  },
  {
    id: 'dec-sup-1',
    reference: 'SUP-2026-09',
    texte: 'Renforcer la présence des équipes Accueil et Louange au culte.',
    instance: 'Supervision',
    responsable: 'Daniel KABONGO',
    echeance: '2026-10-15',
    statut: 'en_cours',
    idDepartement: LOUANGE_ID,
  },
  {
    id: 'dec-dge-2',
    reference: 'DGE-2026-08',
    texte: 'Clôturer le projet de sonorisation avant le trimestre.',
    instance: 'DGE',
    responsable: 'Esther KALALA',
    echeance: '2026-09-10',
    statut: 'en_retard',
    idDepartement: ACCUEIL_ID,
  },
]

let decisions = seedDecisions.map((item) => ({ ...item }))
const listeners = new Set<() => void>()
let version = 0

function emit() {
  version += 1
  listeners.forEach((listener) => listener())
}

export function subscribeDecisions(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getDecisionsVersion() {
  return version
}

export function listDecisions(filtreIds?: string[]) {
  if (!filtreIds) return [...decisions]
  const ids = new Set(filtreIds)
  return decisions.filter((item) => !item.idDepartement || ids.has(item.idDepartement))
}

export function decisionStatutLabel(statut: DecisionStatut) {
  if (statut === 'executee') return 'Exécutée'
  if (statut === 'en_retard') return 'En retard'
  if (statut === 'bloquee') return 'Bloquée'
  return 'En cours'
}

export function snapshotDecisions() {
  return structuredClone(decisions)
}

export function replaceDecisions(next: Decision[]) {
  decisions = structuredClone(next)
  emit()
}

export function resetDecisions() {
  decisions = seedDecisions.map((item) => ({ ...item }))
  emit()
}
