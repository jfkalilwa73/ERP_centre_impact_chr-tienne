import type { Circulation, CirculationKind } from './circulation'
import type { DemandeSuperviseur } from './store'

export const INBOX_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Tous les types' },
  { value: 'rapport', label: 'Rapports' },
  { value: 'demande', label: 'Demandes du DGE' },
  { value: 'budget', label: 'Demandes de budget' },
  { value: 'alerte', label: 'Alertes' },
  { value: 'rappel', label: 'Rappels' },
  { value: 'compte_rendu', label: 'Comptes rendus' },
  { value: 'ouverture', label: 'Ouverture de comptes' },
]

export type InboxFilter = {
  q: string
  kind: string
  departement: string
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function matchesQuery(haystack: string, query: string) {
  const needle = normalize(query.trim())
  if (!needle) return true
  return normalize(haystack).includes(needle)
}

export function filterCirculations(items: Circulation[], filter: InboxFilter) {
  if (filter.kind === 'ouverture') return []
  return items.filter((item) => {
    if (filter.kind && item.kind !== (filter.kind as CirculationKind)) return false
    if (
      filter.departement &&
      item.nomDepartementSource !== filter.departement &&
      item.nomDepartementCible !== filter.departement
    ) {
      return false
    }
    return matchesQuery(
      [item.titre, item.description, item.nomAuteur, item.nomDepartementSource, item.nomDepartementCible].join(' '),
      filter.q,
    )
  })
}

export function filterDemandes(items: DemandeSuperviseur[], filter: InboxFilter) {
  if (filter.kind && filter.kind !== 'ouverture') return []
  return items.filter((item) => {
    if (filter.departement && item.nomDepartement !== filter.departement) return false
    return matchesQuery(
      [item.nomCible, item.nomDemandeur, item.nomDepartement, item.roleCible, item.emailCree ?? ''].join(' '),
      filter.q,
    )
  })
}

export function inboxDepartements(circulations: Circulation[], demandes: DemandeSuperviseur[]) {
  return [
    ...new Set([
      ...circulations.flatMap((item) => [item.nomDepartementSource, item.nomDepartementCible]),
      ...demandes.map((item) => item.nomDepartement),
    ]),
  ]
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, 'fr'))
}
