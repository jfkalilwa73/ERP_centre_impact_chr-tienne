import type { CompteStatut } from '@/types'

export const statutCompteLabels: Record<CompteStatut, string> = {
  actif: 'Actif',
  suspendu: 'Suspendu',
  desactive: 'Désactivé',
}

export function statutCompteBadgeClass(statut: CompteStatut) {
  if (statut === 'actif') return 'bg-emerald-50 text-emerald-700'
  if (statut === 'suspendu') return 'bg-amber-50 text-amber-800'
  return 'bg-slate-100 text-slate-500'
}
