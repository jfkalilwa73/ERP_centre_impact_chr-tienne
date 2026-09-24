export type Objectif = {
  id: string
  libelle: string
  cible: string
  avancement: number
  ecart: string
}

export type PlanAction = {
  id: string
  idObjectif?: string
  libelle: string
  echeance: string
  statut: 'ouvert' | 'fait'
}

export type RapportStatut = 'brouillon' | 'transmis'

export type Rapport = {
  id: string
  titre: string
  description: string
  idDepartementSource: string
  nomDepartementSource: string
  idDepartementCible: string
  nomDepartementCible: string
  statut: RapportStatut
  date: string
}

const LOUANGE_ID = 'd4f6b8c0-0006-4000-8000-000000000002'

const seedObjectifs: Record<string, Objectif[]> = {
  [LOUANGE_ID]: [
    {
      id: 'obj-louange-1',
      libelle: 'Préparer 12 cultes du trimestre',
      cible: '12 cultes',
      avancement: 67,
      ecart: '2 cultes encore à couvrir',
    },
  ],
}

const seedPlans: Record<string, PlanAction[]> = {
  [LOUANGE_ID]: [
    {
      id: 'plan-louange-1',
      idObjectif: 'obj-louange-1',
      libelle: 'Recruter deux choristes',
      echeance: '2026-10-15',
      statut: 'ouvert',
    },
  ],
}

const seedRapports: Rapport[] = [
  {
    id: 'rap-louange-1',
    titre: 'Compte rendu août',
    description: 'Répétitions tenues. Besoin de renforcer le choeur.',
    idDepartementSource: LOUANGE_ID,
    nomDepartementSource: 'Département Louange',
    idDepartementCible: LOUANGE_ID,
    nomDepartementCible: 'Département Louange',
    statut: 'transmis',
    date: '2026-09-02',
  },
]

function cloneMap<T>(source: Record<string, T[]>) {
  return Object.fromEntries(
    Object.entries(source).map(([id, items]) => [id, items.map((item) => ({ ...item }))]),
  )
}

let objectifs = cloneMap(seedObjectifs)
let plans = cloneMap(seedPlans)
let rapports = seedRapports.map((item) => ({ ...item }))
const listeners = new Set<() => void>()
let version = 0

function emit() {
  version += 1
  listeners.forEach((listener) => listener())
}

export function subscribeRapports(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getRapportsVersion() {
  return version
}

export function listObjectifs(departementId: string) {
  return [...(objectifs[departementId] ?? [])]
}

export function addObjectif(departementId: string, input: Omit<Objectif, 'id'>) {
  const created: Objectif = {
    id: crypto.randomUUID(),
    libelle: input.libelle.trim(),
    cible: input.cible.trim(),
    avancement: Math.min(100, Math.max(0, input.avancement)),
    ecart: input.ecart.trim(),
  }
  objectifs[departementId] = [created, ...(objectifs[departementId] ?? [])]
  emit()
  return created
}

export function updateObjectif(departementId: string, id: string, input: Partial<Omit<Objectif, 'id'>>) {
  const found = (objectifs[departementId] ?? []).find((item) => item.id === id)
  if (!found) return
  if (input.libelle !== undefined) found.libelle = input.libelle.trim()
  if (input.cible !== undefined) found.cible = input.cible.trim()
  if (input.avancement !== undefined) found.avancement = Math.min(100, Math.max(0, input.avancement))
  if (input.ecart !== undefined) found.ecart = input.ecart.trim()
  emit()
}

export function listPlansAction(departementId: string) {
  return [...(plans[departementId] ?? [])].sort((left, right) => left.echeance.localeCompare(right.echeance))
}

export function addPlanAction(departementId: string, input: Omit<PlanAction, 'id'>) {
  const created: PlanAction = {
    id: crypto.randomUUID(),
    idObjectif: input.idObjectif,
    libelle: input.libelle.trim(),
    echeance: input.echeance,
    statut: input.statut ?? 'ouvert',
  }
  plans[departementId] = [created, ...(plans[departementId] ?? [])]
  emit()
  return created
}

export function marquerPlanFait(departementId: string, id: string) {
  const found = (plans[departementId] ?? []).find((item) => item.id === id)
  if (found) found.statut = 'fait'
  emit()
}

export function listRapports(departementId: string) {
  return [...rapports]
    .filter(
      (item) =>
        item.idDepartementSource === departementId || item.idDepartementCible === departementId,
    )
    .sort((left, right) => right.date.localeCompare(left.date))
}

export function listRapportsConsolides(departementIds: string[]) {
  const ids = new Set(departementIds)
  return [...rapports]
    .filter(
      (item) => ids.has(item.idDepartementSource) || ids.has(item.idDepartementCible),
    )
    .sort((left, right) => right.date.localeCompare(left.date))
}

export function addRapport(input: {
  titre: string
  description: string
  idDepartementSource: string
  nomDepartementSource: string
  idDepartementCible: string
  nomDepartementCible: string
}) {
  const created: Rapport = {
    id: crypto.randomUUID(),
    titre: input.titre.trim(),
    description: input.description.trim(),
    idDepartementSource: input.idDepartementSource,
    nomDepartementSource: input.nomDepartementSource,
    idDepartementCible: input.idDepartementCible,
    nomDepartementCible: input.nomDepartementCible,
    statut: 'transmis',
    date: new Date().toISOString().slice(0, 10),
  }
  rapports = [created, ...rapports]
  emit()
  return created
}

export function transmettreRapport(id: string) {
  const found = rapports.find((item) => item.id === id)
  if (found) found.statut = 'transmis'
  emit()
}

export function resetRapports() {
  objectifs = cloneMap(seedObjectifs)
  plans = cloneMap(seedPlans)
  rapports = seedRapports.map((item) => ({ ...item }))
  emit()
}
