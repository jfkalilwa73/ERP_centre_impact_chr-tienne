import { useMemo, useSyncExternalStore } from 'react'

export type UnitAccessKind = 'departement' | 'famille'

export const APPLICATION_PAGES = [
  { id: 'accueil', label: 'Accueil', path: '/' },
  { id: 'notifications', label: 'Notifications', path: '/notifications' },
  { id: 'personnes', label: 'Personnes', path: '/personnes' },
  { id: 'departements', label: 'Départements', path: '/departements' },
  { id: 'departements-suivi', label: 'Suivi DGE des départements', path: '/departements/suivi' },
  { id: 'departements-rapports', label: 'Rapports reçus des départements', path: '/departements/rapports' },
  { id: 'familles', label: "Familles d’impact", path: '/familles' },
  { id: 'familles-suivi', label: 'Suivi DGE des familles', path: '/familles/suivi' },
  { id: 'familles-rapports', label: 'Rapports reçus des familles', path: '/familles/rapports' },
  { id: 'comptes', label: 'Comptes', path: '/comptes' },
  { id: 'sites', label: 'Sites', path: '/sites' },
  { id: 'roles', label: 'Rôles', path: '/roles' },
  { id: 'permissions', label: 'Permissions', path: '/permissions' },
  { id: 'audit', label: 'Audit', path: '/audit' },
] as const

export const UNIT_DETAIL_PAGES = [
  { id: 'tableau', label: 'Synthèse' },
  { id: 'membres', label: 'Membres' },
  { id: 'activites', label: 'Activités' },
  { id: 'budget', label: 'Budget' },
  { id: 'rapports', label: 'Rapports' },
] as const

export type UnitDetailPageId = (typeof UNIT_DETAIL_PAGES)[number]['id']
export type ApplicationPageId = (typeof APPLICATION_PAGES)[number]['id']
export type UnitPageId = UnitDetailPageId | ApplicationPageId

type SavedPageRule = { pages: string[]; applicationPagesConfigured?: boolean }
type SavedPageRules = Record<string, SavedPageRule>

const STORAGE_KEY = 'erp-icc:unit-page-access:v1'
const listeners = new Set<() => void>()
const EMPTY_SNAPSHOT = '{}'

function readSnapshot(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? '{}'
  } catch {
    return '{}'
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) listener()
  }
  window.addEventListener('storage', onStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function parseRules(snapshot: string): SavedPageRules {
  try {
    const value: unknown = JSON.parse(snapshot)
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as SavedPageRules)
      : {}
  } catch {
    return {}
  }
}

function ruleKey(kind: UnitAccessKind, unitId: string, personneId: string) {
  return `${kind}:${encodeURIComponent(unitId)}:${encodeURIComponent(personneId)}`
}

function isPageId(value: string): value is UnitDetailPageId {
  return UNIT_DETAIL_PAGES.some((page) => page.id === value)
}

function isApplicationPageId(value: string): value is ApplicationPageId {
  return APPLICATION_PAGES.some((page) => page.id === value)
}

function isUnitPageId(value: string): value is UnitPageId {
  return isPageId(value) || isApplicationPageId(value)
}

export function hasUnitApplicationPageRuleForPerson(
  personneId: string,
  snapshot = readSnapshot(),
): boolean {
  const suffix = `:${encodeURIComponent(personneId)}`
  return Object.entries(parseRules(snapshot)).some(
    ([key, rule]) =>
      (key.startsWith('departement:') || key.startsWith('famille:')) &&
      key.endsWith(suffix) &&
      rule.applicationPagesConfigured === true,
  )
}

export function getUnitPageRule(
  kind: UnitAccessKind,
  unitId: string,
  personneId: string,
): UnitPageId[] | null {
  const rule = parseRules(readSnapshot())[ruleKey(kind, unitId, personneId)]
  if (!rule || !Array.isArray(rule.pages)) return null

  return [
    ...new Set(
      rule.pages
        .filter((page): page is string => typeof page === 'string')
        .filter(isUnitPageId),
    ),
  ]
}

export function getUnitApplicationPageRule(
  kind: UnitAccessKind,
  unitId: string,
  personneId: string,
  snapshot = readSnapshot(),
): ApplicationPageId[] | null {
  const rule = parseRules(snapshot)[ruleKey(kind, unitId, personneId)]
  if (!rule || rule.applicationPagesConfigured !== true || !Array.isArray(rule.pages)) return null

  return [
    ...new Set(
      rule.pages
        .filter((page): page is string => typeof page === 'string')
        .filter(isApplicationPageId),
    ),
  ]
}

export function useUnitPageRulesSnapshot() {
  return useSyncExternalStore(subscribe, readSnapshot, () => EMPTY_SNAPSHOT)
}

export function saveUnitPageRule(
  kind: UnitAccessKind,
  unitId: string,
  personneId: string,
  pages: readonly UnitPageId[],
  applicationPagesConfigured = true,
): boolean {
  try {
    const current = parseRules(readSnapshot())
    current[ruleKey(kind, unitId, personneId)] = {
      pages: [...new Set(pages)],
      applicationPagesConfigured,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    listeners.forEach((listener) => listener())
    return true
  } catch {
    return false
  }
}

export function clearUnitPageRule(kind: UnitAccessKind, unitId: string, personneId: string): boolean {
  try {
    const current = parseRules(readSnapshot())
    delete current[ruleKey(kind, unitId, personneId)]
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    listeners.forEach((listener) => listener())
    return true
  } catch {
    return false
  }
}

export function useUnitPageAccess(kind: UnitAccessKind, unitId?: string, personneId?: string) {
  const snapshot = useUnitPageRulesSnapshot()
  const pages = useMemo(() => {
    if (!unitId || !personneId) return null
    const rule = parseRules(snapshot)[ruleKey(kind, unitId, personneId)]
    if (!rule || !Array.isArray(rule.pages)) return null

    return new Set(
      [...new Set(rule.pages.filter((page): page is string => typeof page === 'string').filter(isPageId))],
    )
  }, [kind, personneId, snapshot, unitId])

  return {
    configured: pages !== null,
    canView(page: UnitDetailPageId, defaultAllowed: boolean) {
      return pages === null ? defaultAllowed : pages.has(page)
    },
  }
}
