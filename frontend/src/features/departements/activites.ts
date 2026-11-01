import { clampText, canMutateUnite, MAX_DESCRIPTION } from '@/lib/writeAccess'
import { PERMISSIONS } from '@/lib/permissions'
import type { SourceCaisse } from './budget'

export type ActiviteStatut = 'planifiee' | 'faite'
export type ActiviteConcerne = 'equipe' | 'benevoles' | 'priere' | 'tous'
export type ActiviteRecurrence = 'unique' | 'constante'
export type ActiviteModalite = 'presentiel' | 'en_ligne'

export type PresenceMembre = {
  idPersonne: string
  nom: string
  present: boolean
}

export type CompteRenduActivite = {
  presence: PresenceMembre[]
  deroulement: string
  date: string
}

export type Activite = {
  id: string
  titre: string
  date: string
  description: string
  statut: ActiviteStatut
  idResponsable?: string
  nomResponsable?: string
  echeance?: string
  concerne?: ActiviteConcerne
  recurrence?: ActiviteRecurrence
  jours?: number[]
  heure?: string
  modalite?: ActiviteModalite
  sourceBudget?: SourceCaisse
  montantBudget?: number
  compteRendu?: CompteRenduActivite
}

export type ActiviteDepartement = Activite

export const CONCERNES: { value: ActiviteConcerne; label: string }[] = [
  { value: 'equipe', label: 'Équipe' },
  { value: 'benevoles', label: 'Bénévoles' },
  { value: 'priere', label: 'Prière' },
  { value: 'tous', label: 'Tout le département' },
]

export const JOURS_SEMAINE: { value: number; label: string }[] = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
]

export function concerneLabel(concerne?: ActiviteConcerne) {
  return CONCERNES.find((item) => item.value === concerne)?.label
}

export function modaliteLabel(modalite?: ActiviteModalite) {
  if (modalite === 'en_ligne') return 'En ligne'
  if (modalite === 'presentiel') return 'Présentiel'
  return undefined
}

export function formatHeure(heure?: string) {
  if (!heure) return ''
  const [hours, minutes] = heure.split(':')
  if (!hours) return heure
  return minutes && minutes !== '00' ? `${Number(hours)} h ${minutes}` : `${Number(hours)} h`
}

export function formatJours(jours?: number[]) {
  if (!jours?.length) return ''
  const labels = JOURS_SEMAINE.filter((jour) => jours.includes(jour.value)).map((jour) =>
    jour.label.toLowerCase(),
  )
  if (labels.length === 1) return `chaque ${labels[0]}`
  const last = labels[labels.length - 1]
  return `chaque ${labels.slice(0, -1).join(', ')} et ${last}`
}

export function resumeActivite(activite: Pick<Activite, 'date' | 'recurrence' | 'jours' | 'heure' | 'modalite'>) {
  const parts: string[] = []
  if (activite.recurrence === 'constante') {
    parts.push(formatJours(activite.jours) || 'activité constante')
  } else if (activite.date) {
    parts.push(
      new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(activite.date)),
    )
  }
  if (activite.heure) parts.push(`à ${formatHeure(activite.heure)}`)
  const modalite = modaliteLabel(activite.modalite)
  if (modalite) parts.push(modalite.toLowerCase())
  return parts.join(' · ')
}

export function messageRappel(activite: Activite) {
  const resume = resumeActivite(activite)
  const debut = resume
    ? `${activite.titre} commence ${resume}.`
    : `${activite.titre} a été planifiée.`
  return activite.description.trim() ? `${debut} ${activite.description.trim()}` : debut
}

export function dateFinActivite(activite: Pick<Activite, 'date' | 'echeance'>) {
  return activite.echeance || activite.date
}

export function besoinCompteRendu(
  activite: Activite,
  today = new Date().toISOString().slice(0, 10),
) {
  if (activite.compteRendu || activite.statut === 'faite') return false
  if (activite.recurrence === 'constante') return false
  return dateFinActivite(activite) <= today
}

type ActiviteInput = Omit<Activite, 'id' | 'statut'> & { statut?: ActiviteStatut }

const ACTIVITE_WRITE = [PERMISSIONS.ACTIVITES_CREATE, PERMISSIONS.ACTIVITES_UPDATE] as const

function applyActiviteFields(target: Activite, input: Partial<ActiviteInput>) {
  if (input.titre !== undefined) target.titre = clampText(input.titre)
  if (input.date !== undefined) target.date = input.date
  if (input.description !== undefined) target.description = clampText(input.description, MAX_DESCRIPTION)
  if (input.statut !== undefined) target.statut = input.statut
  if (input.idResponsable !== undefined) target.idResponsable = input.idResponsable || undefined
  if (input.nomResponsable !== undefined) target.nomResponsable = input.nomResponsable.trim() || undefined
  if (input.echeance !== undefined) target.echeance = input.echeance || undefined
  if (input.concerne !== undefined) target.concerne = input.concerne
  if (input.recurrence !== undefined) target.recurrence = input.recurrence
  if (input.jours !== undefined) target.jours = input.jours.length ? [...input.jours] : undefined
  if (input.heure !== undefined) target.heure = input.heure || undefined
  if (input.modalite !== undefined) target.modalite = input.modalite || undefined
  if (input.sourceBudget !== undefined) target.sourceBudget = input.sourceBudget || undefined
  if (input.montantBudget !== undefined) {
    target.montantBudget = input.montantBudget && input.montantBudget > 0 ? input.montantBudget : undefined
  }
  if (input.compteRendu !== undefined) target.compteRendu = input.compteRendu
}

/** Store local d'activités par entité (département, famille d'impact…), en attendant l'API. */
export function createActivitesStore(initiales: Record<string, Activite[]>) {
  function cloneSeed() {
    const copy: Record<string, Activite[]> = {}
    for (const [id, items] of Object.entries(initiales)) {
      copy[id] = items.map((item) => ({
        ...item,
        jours: item.jours ? [...item.jours] : undefined,
        compteRendu: item.compteRendu
          ? {
              ...item.compteRendu,
              presence: item.compteRendu.presence.map((ligne) => ({ ...ligne })),
            }
          : undefined,
      }))
    }
    return copy
  }

  let activites: Record<string, Activite[]> = cloneSeed()
  const listeners = new Set<() => void>()
  let version = 0

  function emit() {
    version += 1
    listeners.forEach((listener) => listener())
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    getVersion() {
      return version
    },

    list(ownerId: string) {
      return [...(activites[ownerId] ?? [])].sort((left, right) => {
        const leftConstante = left.recurrence === 'constante' ? 0 : 1
        const rightConstante = right.recurrence === 'constante' ? 0 : 1
        if (leftConstante !== rightConstante) return leftConstante - rightConstante
        return right.date.localeCompare(left.date)
      })
    },

    listAll() {
      return Object.entries(activites).flatMap(([ownerId, items]) =>
        items.map((item) => ({ ...item, ownerId })),
      )
    },

    add(ownerId: string, input: ActiviteInput) {
      if (!canMutateUnite(ownerId, ACTIVITE_WRITE)) return undefined
      const created: Activite = {
        id: crypto.randomUUID(),
        titre: clampText(input.titre),
        date: input.date,
        description: clampText(input.description, MAX_DESCRIPTION),
        statut: input.statut ?? 'planifiee',
      }
      applyActiviteFields(created, input)
      activites[ownerId] = [created, ...(activites[ownerId] ?? [])]
      emit()
      return created
    },

    update(ownerId: string, activiteId: string, input: Partial<ActiviteInput>) {
      if (!canMutateUnite(ownerId, ACTIVITE_WRITE)) return
      const found = (activites[ownerId] ?? []).find((item) => item.id === activiteId)
      if (!found) return
      applyActiviteFields(found, input)
      emit()
      return found
    },

    marquerFaite(ownerId: string, activiteId: string) {
      if (!canMutateUnite(ownerId, ACTIVITE_WRITE)) return
      const found = (activites[ownerId] ?? []).find((item) => item.id === activiteId)
      if (found) found.statut = 'faite'
      emit()
    },

    enregistrerCompteRendu(ownerId: string, activiteId: string, input: CompteRenduActivite) {
      if (!canMutateUnite(ownerId, ACTIVITE_WRITE)) return
      const found = (activites[ownerId] ?? []).find((item) => item.id === activiteId)
      if (!found) return
      found.compteRendu = {
        presence: input.presence.map((ligne) => ({ ...ligne })),
        deroulement: clampText(input.deroulement, MAX_DESCRIPTION),
        date: input.date,
      }
      found.statut = 'faite'
      emit()
      return found
    },

    remove(ownerId: string, activiteId: string) {
      if (!canMutateUnite(ownerId, ACTIVITE_WRITE)) return
      activites[ownerId] = (activites[ownerId] ?? []).filter((item) => item.id !== activiteId)
      emit()
    },

    reset() {
      activites = cloneSeed()
      emit()
    },
  }
}

const ACCUEIL_ID = 'd4f6b8c0-0006-4000-8000-000000000001'
const LOUANGE_ID = 'd4f6b8c0-0006-4000-8000-000000000002'

const store = createActivitesStore({
  [ACCUEIL_ID]: [
    {
      id: 'act-accueil-1',
      titre: 'Réunion de coordination',
      date: '2026-04-18',
      description: 'Préparation des équipes du dimanche.',
      statut: 'faite',
      concerne: 'equipe',
      recurrence: 'unique',
      compteRendu: {
        date: '2026-04-18',
        deroulement: 'Équipes du dimanche réparties.',
        presence: [
          { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000001', nom: 'Jean KABILA', present: true },
          { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000002', nom: 'Grâce MUKENDI', present: true },
          { idPersonne: 'b2d4f6a8-0004-4000-8000-00000000000a', nom: 'Daniel KASONGO', present: true },
        ],
      },
    },
    {
      id: 'act-accueil-2',
      titre: 'Formation des hôtes',
      date: '2026-06-12',
      description: '',
      statut: 'faite',
      concerne: 'benevoles',
      recurrence: 'unique',
      compteRendu: {
        date: '2026-06-12',
        deroulement: 'Accueil porte principale revu.',
        presence: [
          { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000001', nom: 'Jean KABILA', present: true },
          { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000002', nom: 'Grâce MUKENDI', present: true },
          { idPersonne: 'b2d4f6a8-0004-4000-8000-00000000000a', nom: 'Daniel KASONGO', present: true },
        ],
      },
    },
    {
      id: 'act-accueil-3',
      titre: 'Briefing de rentrée',
      date: '2026-09-14',
      description: '',
      statut: 'planifiee',
      concerne: 'equipe',
      recurrence: 'unique',
    },
  ],
  [LOUANGE_ID]: [
    {
      id: 'act-louange-rep',
      titre: 'Répétition',
      date: '2026-09-22',
      description: 'Répétition du choeur. Présence de toute l’équipe musicale.',
      statut: 'planifiee',
      concerne: 'equipe',
      recurrence: 'constante',
      jours: [2, 6],
      heure: '18:00',
      modalite: 'presentiel',
    },
    {
      id: 'act-louange-priere',
      titre: 'Prière du département',
      date: '2026-09-24',
      description: 'Temps de prière en visio, ouvert à toute l’équipe.',
      statut: 'planifiee',
      concerne: 'priere',
      recurrence: 'constante',
      jours: [3],
      heure: '20:00',
      modalite: 'en_ligne',
    },
    {
      id: 'act-louange-1',
      titre: 'Répétition générale',
      date: '2026-05-03',
      description: '',
      statut: 'faite',
      concerne: 'equipe',
      recurrence: 'unique',
      compteRendu: {
        date: '2026-05-03',
        deroulement: 'Répétition tenue.',
        presence: [
          { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000007', nom: 'Pierre MWAMBA', present: true },
          { idPersonne: 'b2d4f6a8-0004-4000-8000-00000000000a', nom: 'Daniel KASONGO', present: true },
        ],
      },
    },
    {
      id: 'act-louange-atelier',
      titre: 'Atelier vocal',
      date: '2026-06-20',
      description: '',
      statut: 'faite',
      concerne: 'equipe',
      recurrence: 'unique',
      compteRendu: {
        date: '2026-06-20',
        deroulement: 'Travail des voix.',
        presence: [
          { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000007', nom: 'Pierre MWAMBA', present: true },
          { idPersonne: 'b2d4f6a8-0004-4000-8000-00000000000a', nom: 'Daniel KASONGO', present: false },
        ],
      },
    },
    {
      id: 'act-louange-culte',
      titre: 'Culte du 14 juin',
      date: '2026-06-14',
      description: '',
      statut: 'faite',
      concerne: 'equipe',
      recurrence: 'unique',
      compteRendu: {
        date: '2026-06-14',
        deroulement: 'Culte conduit.',
        presence: [
          { idPersonne: 'b2d4f6a8-0004-4000-8000-000000000007', nom: 'Pierre MWAMBA', present: true },
          { idPersonne: 'b2d4f6a8-0004-4000-8000-00000000000a', nom: 'Daniel KASONGO', present: false },
        ],
      },
    },
    {
      id: 'act-louange-2',
      titre: 'Préparation du culte',
      date: '2026-09-07',
      description: '',
      statut: 'planifiee',
      idResponsable: 'b2d4f6a8-0004-4000-8000-000000000007',
      nomResponsable: 'Pierre MWAMBA',
      echeance: '2026-09-06',
      concerne: 'equipe',
      recurrence: 'unique',
    },
  ],
})

export const subscribeActivites = store.subscribe
export const getActivitesVersion = store.getVersion
export const listActivites = store.list
export const addActivite = store.add
export const updateActivite = store.update
export const marquerActiviteFaite = store.marquerFaite
export const enregistrerCompteRendu = store.enregistrerCompteRendu
export const deleteActivite = store.remove
export const resetActivites = store.reset

export function listAllActivites() {
  return store.listAll().map(({ ownerId, ...item }) => ({ ...item, idDepartement: ownerId }))
}
