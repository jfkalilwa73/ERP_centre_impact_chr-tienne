import { clampText, canMutateUnite } from '@/lib/writeAccess'
import { PERMISSIONS } from '@/lib/permissions'

export type ProjetStatut = 'en_cours' | 'en_retard' | 'cloture'
export type RisqueStatut = 'ouvert' | 'mitige' | 'clos'
export type Gravite = 'faible' | 'moyenne' | 'haute'

export type Projet = {
  id: string
  code: string
  titre: string
  idDepartement: string
  nomDepartement: string
  responsable: string
  budget: number
  statut: ProjetStatut
  priorite: Gravite
  progression: number
  dateFin: string
}

export type Risque = {
  id: string
  idProjet: string
  libelle: string
  probabilite: Gravite
  impact: Gravite
  statut: RisqueStatut
  mitigation: string
}

const ACCUEIL_ID = 'd4f6b8c0-0006-4000-8000-000000000001'
const LOUANGE_ID = 'd4f6b8c0-0006-4000-8000-000000000002'
const BATISSEURS_ID = 'f1a2b3c4-0008-4000-8000-000000000001'

const seedProjets: Projet[] = [
  {
    id: 'prj-louange-1',
    code: 'PROJ-LOU-01',
    titre: 'Renforcer la chorale jeunesse',
    idDepartement: LOUANGE_ID,
    nomDepartement: 'Département Louange',
    responsable: 'Pierre MWAMBA',
    budget: 800,
    statut: 'en_cours',
    priorite: 'haute',
    progression: 45,
    dateFin: '2026-11-30',
  },
  {
    id: 'prj-accueil-1',
    code: 'PROJ-ACC-01',
    titre: 'Parcours des nouveaux visiteurs',
    idDepartement: ACCUEIL_ID,
    nomDepartement: 'Département Accueil',
    responsable: 'Ruth NGOY',
    budget: 300,
    statut: 'en_cours',
    priorite: 'moyenne',
    progression: 60,
    dateFin: '2026-10-31',
  },
  {
    id: 'prj-batisseurs-1',
    code: 'PROJ-FAM-01',
    titre: 'Visites de quartier',
    idDepartement: BATISSEURS_ID,
    nomDepartement: 'Famille Bâtisseurs',
    responsable: 'Chef de famille',
    budget: 150,
    statut: 'en_retard',
    priorite: 'moyenne',
    progression: 20,
    dateFin: '2026-09-15',
  },
]

const seedRisques: Risque[] = [
  {
    id: 'rsk-louange-1',
    idProjet: 'prj-louange-1',
    libelle: 'Manque de choristes le dimanche',
    probabilite: 'haute',
    impact: 'haute',
    statut: 'ouvert',
    mitigation: 'Recruter deux choristes avant octobre.',
  },
  {
    id: 'rsk-accueil-1',
    idProjet: 'prj-accueil-1',
    libelle: 'Fiches visiteurs incomplètes',
    probabilite: 'moyenne',
    impact: 'moyenne',
    statut: 'mitige',
    mitigation: 'Contrôle à la sortie de chaque culte.',
  },
]

let projets = seedProjets.map((item) => ({ ...item }))
let risques = seedRisques.map((item) => ({ ...item }))
const listeners = new Set<() => void>()
let version = 0

function emit() {
  version += 1
  listeners.forEach((listener) => listener())
}

export function subscribeProjets(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getProjetsVersion() {
  return version
}

export function listProjets(departementId: string) {
  return projets.filter((item) => item.idDepartement === departementId)
}

export function listAllProjets(filtreIds?: string[]) {
  const ids = filtreIds ? new Set(filtreIds) : null
  return projets.filter((item) => !ids || ids.has(item.idDepartement))
}

export function listRisques(idProjet: string) {
  return risques.filter((item) => item.idProjet === idProjet)
}

export function listAllRisques(filtreIds?: string[]) {
  const projetIds = new Set(listAllProjets(filtreIds).map((item) => item.id))
  return risques.filter((item) => projetIds.has(item.idProjet))
}

export function addProjet(
  departementId: string,
  nomDepartement: string,
  input: Omit<Projet, 'id' | 'idDepartement' | 'nomDepartement'>,
) {
  if (!canMutateUnite(departementId, [PERMISSIONS.PROJETS_MANAGE])) return undefined
  const created: Projet = {
    ...input,
    id: crypto.randomUUID(),
    code: clampText(input.code, 40),
    titre: clampText(input.titre),
    idDepartement: departementId,
    nomDepartement,
    responsable: clampText(input.responsable),
    progression: Math.min(100, Math.max(0, input.progression)),
  }
  projets = [created, ...projets]
  emit()
  return created
}

export function addRisque(idProjet: string, input: Omit<Risque, 'id' | 'idProjet'>) {
  const projet = projets.find((item) => item.id === idProjet)
  if (!projet) return undefined
  if (!canMutateUnite(projet.idDepartement, [PERMISSIONS.PROJETS_MANAGE])) return undefined
  const created: Risque = {
    ...input,
    id: crypto.randomUUID(),
    idProjet,
    libelle: clampText(input.libelle),
    mitigation: clampText(input.mitigation),
  }
  risques = [created, ...risques]
  emit()
  return created
}

export function projetStatutLabel(statut: ProjetStatut) {
  if (statut === 'cloture') return 'Clôturé'
  if (statut === 'en_retard') return 'En retard'
  return 'En cours'
}

export function risqueStatutLabel(statut: RisqueStatut) {
  if (statut === 'clos') return 'Clos'
  if (statut === 'mitige') return 'Atténué'
  return 'Ouvert'
}

export function graviteLabel(value: Gravite) {
  if (value === 'haute') return 'Haute'
  if (value === 'moyenne') return 'Moyenne'
  return 'Faible'
}

export function resetProjets() {
  projets = seedProjets.map((item) => ({ ...item }))
  risques = seedRisques.map((item) => ({ ...item }))
  emit()
}
