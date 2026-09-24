import type { AffectationFamille, FamilleImpact } from '@/types'
import type { Activite } from '@/features/departements/activites'

export type PointEvolution = {
  mois: string
  affectes: number
  retraits: number
}

export type PointActivites = {
  mois: string
  planifiees: number
  faites: number
}

export type EffectifFamille = {
  nom: string
  membres: number
  retraits: number
}

function monthKey(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(0, 7)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [year, month] = key.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(date)
}

function lastMonthKeys(months = 6) {
  const now = new Date()
  const keys: string[] = []
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    keys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }
  return keys
}

export function evolutionFamille(membres: AffectationFamille[], months = 12): PointEvolution[] {
  const keys = lastMonthKeys(months)
  return keys.map((key) => ({
    mois: monthLabel(key),
    affectes: membres.filter((item) => monthKey(item.dateDebut) === key).length,
    retraits: membres.filter((item) => item.dateFin && monthKey(item.dateFin) === key).length,
  }))
}

export function evolutionActivites(activites: Activite[], months = 12): PointActivites[] {
  const keys = lastMonthKeys(months)
  return keys.map((key) => ({
    mois: monthLabel(key),
    planifiees: activites.filter((item) => monthKey(item.date) === key && item.statut === 'planifiee')
      .length,
    faites: activites.filter((item) => monthKey(item.date) === key && item.statut === 'faite').length,
  }))
}

export function effectifsParFamille(
  familles: FamilleImpact[],
  membres: AffectationFamille[],
): EffectifFamille[] {
  return familles.map((famille) => {
    const linked = membres.filter((item) => item.idFamille === famille.idFamille)
    return {
      nom: famille.nom,
      membres: linked.filter((item) => item.actif).length,
      retraits: linked.filter((item) => !item.actif).length,
    }
  })
}
