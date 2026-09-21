import type { PersonneStatut } from '@/types'

export const STATUT_LABELS: Record<PersonneStatut, string> = {
  actif: 'Actif',
  inactif: 'Inactif',
  archive: 'Archivé',
}

export function statutBadgeClass(statut: PersonneStatut | undefined) {
  if (statut === 'actif') return 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'
  if (statut === 'archive') return 'rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800'
  return 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
}

export function formatDate(value: string | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
}

export function formatDateLong(value: string | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(value),
  )
}
