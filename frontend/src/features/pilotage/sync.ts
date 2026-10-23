import { api } from '@/lib/apiClient'
import { ApiError } from '@/lib/apiError'
import {
  getActivitesVersion,
  replaceActivites,
  snapshotActivites,
  subscribeActivites,
} from '@/features/departements/activites'
import {
  getBudgetVersion,
  replaceBudget,
  snapshotBudget,
  subscribeBudget,
  type BudgetSnapshot,
} from '@/features/departements/budget'
import {
  getDecisionsVersion,
  replaceDecisions,
  snapshotDecisions,
  subscribeDecisions,
  type Decision,
} from '@/features/departements/decisions'
import {
  getEquipeVersion,
  replaceEquipe,
  snapshotEquipe,
  subscribeEquipe,
} from '@/features/departements/equipe'
import {
  getProjetsVersion,
  replaceProjets,
  snapshotProjets,
  subscribeProjets,
  type Projet,
  type Risque,
} from '@/features/departements/projets'
import {
  getRapportsVersion,
  replaceRapports,
  snapshotRapports,
  subscribeRapports,
  type Objectif,
  type PlanAction,
  type Rapport,
} from '@/features/departements/rapports'
import {
  getActivitesFamilleVersion,
  replaceActivitesFamille,
  snapshotActivitesFamille,
  subscribeActivitesFamille,
} from '@/features/familles/activites'
import {
  getCirculationsVersion,
  replaceCirculations,
  snapshotCirculations,
  subscribeCirculations,
  type Circulation,
} from '@/features/notifications/circulation'
import {
  getDemandesVersion,
  replaceDemandes,
  snapshotDemandes,
  subscribeDemandes,
  type DemandeSuperviseur,
} from '@/features/notifications/store'
import type { Activite } from '@/features/departements/activites'
import type { CreneauBenevole, FicheEquipe } from '@/features/departements/equipe'

export type PilotageSnapshot = {
  activites?: Record<string, Activite[]>
  activitesFamille?: Record<string, Activite[]>
  budget?: BudgetSnapshot
  objectifs?: Record<string, Objectif[]>
  plans?: Record<string, PlanAction[]>
  rapports?: Rapport[]
  projets?: Projet[]
  risques?: Risque[]
  decisions?: Decision[]
  equipe?: { fiches?: Record<string, FicheEquipe[]>; creneaux?: Record<string, CreneauBenevole[]> }
  circulations?: Circulation[]
  demandes?: DemandeSuperviseur[]
  meta?: { seeded?: boolean }
}

export function shouldSyncPilotage() {
  return import.meta.env.MODE !== 'test' && import.meta.env.VITE_USE_MOCKS !== 'true'
}

const MARQUEURS_DEMONSTRATION = [
  'act-louange-culte',
  'act-accueil-3',
  'act-batisseurs-1',
  'dep-louange-2',
  'Présence faible : Daniel KASONGO',
  'Compte rendu à produire : Briefing de rentrée',
]

export function contientJeuDemonstration(remote: PilotageSnapshot) {
  const brut = JSON.stringify(remote)
  return MARQUEURS_DEMONSTRATION.some((marqueur) => brut.includes(marqueur))
}

function revision() {
  return [
    getActivitesVersion(),
    getActivitesFamilleVersion(),
    getBudgetVersion(),
    getRapportsVersion(),
    getProjetsVersion(),
    getDecisionsVersion(),
    getEquipeVersion(),
    getCirculationsVersion(),
    getDemandesVersion(),
  ].join(':')
}

function asRecord<T>(value: unknown): Record<string, T> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, T>
}

function viderPilotageLocal() {
  applyingRemote = true
  try {
    replaceActivites({})
    replaceActivitesFamille({})
    replaceBudget({ enveloppes: {}, depenses: {}, rentrees: {} })
    replaceRapports({ objectifs: {}, plans: {}, rapports: [] })
    replaceProjets({ projets: [], risques: [] })
    replaceDecisions([])
    replaceEquipe({ fiches: {}, creneaux: {} })
    replaceCirculations([])
    replaceDemandes([])
    appliedRevision = revision()
  } finally {
    applyingRemote = false
  }
}

export function dumpPilotage(): PilotageSnapshot {
  const rapports = snapshotRapports()
  const projets = snapshotProjets()
  return {
    activites: snapshotActivites(),
    activitesFamille: snapshotActivitesFamille(),
    budget: snapshotBudget(),
    objectifs: rapports.objectifs,
    plans: rapports.plans,
    rapports: rapports.rapports,
    projets: projets.projets,
    risques: projets.risques,
    decisions: snapshotDecisions(),
    equipe: snapshotEquipe(),
    circulations: snapshotCirculations(),
    demandes: snapshotDemandes(),
  }
}

function applyPilotage(remote: PilotageSnapshot) {
  if ('activites' in remote) replaceActivites(asRecord(remote.activites))
  if ('activitesFamille' in remote) replaceActivitesFamille(asRecord(remote.activitesFamille))
  if (remote.budget && typeof remote.budget === 'object') {
    replaceBudget({
      enveloppes: asRecord(remote.budget.enveloppes),
      depenses: asRecord(remote.budget.depenses),
      rentrees: asRecord(remote.budget.rentrees),
    })
  }
  if ('objectifs' in remote || 'plans' in remote || 'rapports' in remote) {
    replaceRapports({
      objectifs: asRecord(remote.objectifs),
      plans: asRecord(remote.plans),
      rapports: Array.isArray(remote.rapports) ? remote.rapports : [],
    })
  }
  if (Array.isArray(remote.projets) || Array.isArray(remote.risques)) {
    replaceProjets({
      projets: Array.isArray(remote.projets) ? remote.projets : undefined,
      risques: Array.isArray(remote.risques) ? remote.risques : undefined,
    })
  }
  if (Array.isArray(remote.decisions)) replaceDecisions(remote.decisions)
  if (remote.equipe && typeof remote.equipe === 'object') {
    replaceEquipe({
      fiches: asRecord(remote.equipe.fiches),
      creneaux: asRecord(remote.equipe.creneaux),
    })
  }
  if (Array.isArray(remote.circulations)) replaceCirculations(remote.circulations)
  if (Array.isArray(remote.demandes)) replaceDemandes(remote.demandes)
}

async function lirePilotage() {
  const { data } = await api.get<{ data: PilotageSnapshot }>('/pilotage')
  return data.data
}

async function ecrirePilotage(snapshot: PilotageSnapshot) {
  const { data } = await api.put<{ data: PilotageSnapshot }>('/pilotage', snapshot)
  return data.data
}

let activeId = 0
let appliedRevision = ''
let applyingRemote = false
let canWrite = true
let timer: ReturnType<typeof setTimeout> | undefined

export function startPilotageSync() {
  if (!shouldSyncPilotage()) return () => {}

  const id = ++activeId
  canWrite = false
  viderPilotageLocal()
  appliedRevision = revision()

  const schedule = () => {
    if (applyingRemote || !canWrite || activeId !== id) return
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      void flush(id)
    }, 800)
  }

  const stops = [
    subscribeActivites(schedule),
    subscribeActivitesFamille(schedule),
    subscribeBudget(schedule),
    subscribeRapports(schedule),
    subscribeProjets(schedule),
    subscribeDecisions(schedule),
    subscribeEquipe(schedule),
    subscribeCirculations(schedule),
    subscribeDemandes(schedule),
  ]

  const onFocus = () => {
    void pull(id)
  }
  window.addEventListener('focus', onFocus)
  void pull(id)

  return () => {
    if (activeId === id) activeId = 0
    if (timer) clearTimeout(timer)
    stops.forEach((stop) => stop())
    window.removeEventListener('focus', onFocus)
  }
}

async function pull(id: number) {
  if (activeId !== id) return
  let remote: PilotageSnapshot
  try {
    remote = await lirePilotage()
  } catch (error) {
    if (activeId !== id) return
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return
    canWrite = true
    return
  }
  if (activeId !== id) return

  if (!remote.meta?.seeded || contientJeuDemonstration(remote)) {
    viderPilotageLocal()
    appliedRevision = revision()
    if (remote.meta?.seeded) {
      applyingRemote = true
      try {
        await ecrirePilotage(dumpPilotage())
        appliedRevision = revision()
      } catch (error) {
        if (error instanceof ApiError && (error.status === 403 || error.status === 401)) return
      } finally {
        applyingRemote = false
      }
    }
    canWrite = true
    return
  }

  if (revision() !== appliedRevision) {
    canWrite = true
    scheduleMissed(id)
    return
  }

  applyingRemote = true
  try {
    applyPilotage(remote)
    appliedRevision = revision()
  } finally {
    applyingRemote = false
    canWrite = true
  }
}

function scheduleMissed(id: number) {
  if (applyingRemote || !canWrite || activeId !== id) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    void flush(id)
  }, 800)
}

async function flush(id: number) {
  if (!canWrite || activeId !== id || applyingRemote) return
  const before = revision()
  try {
    await ecrirePilotage(dumpPilotage())
  } catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 401)) {
      canWrite = false
    }
    return
  }
  if (revision() === before) appliedRevision = before
}

if (shouldSyncPilotage()) {
  viderPilotageLocal()
}
