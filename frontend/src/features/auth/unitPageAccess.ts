import { useMemo, useSyncExternalStore } from 'react'

export type UnitAccessKind = 'departement' | 'famille'

export const UNIT_DETAIL_PAGES = [
  { id: 'tableau', label: 'Synthèse' },
  { id: 'membres', label: 'Membres' },
  { id: 'activites', label: 'Activités' },
  { id: 'budget', label: 'Budget' },
  { id: 'rapports', label: 'Rapports' },
] as const

export type UnitDetailPageId = (typeof UNIT_DETAIL_PAGES)[number]['id']

type SavedPageRule = { pages: string[] }
type SavedPageRules = Record<string, SavedPageRule>

const STORAGE_KEY = 'erp-icc:unit-page-access:v1'
const listeners = new Set<() => void>()

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

export function getUnitPageRule(
  kind: UnitAccessKind,
  unitId: string,
  personneId: string,
): UnitDetailPageId[] | null {
  const rule = parseRules(readSnapshot())[ruleKey(kind, unitId, personneId)]
  if (!rule || !Array.isArray(rule.pages)) return null

  return [...new Set(rule.pages.filter((page): page is string => typeof page === 'string').filter(isPageId))]
}

export function saveUnitPageRule(
  kind: UnitAccessKind,
  unitId: string,
  personneId: string,
  pages: readonly UnitDetailPageId[],
): boolean {
  try {
    const current = parseRules(readSnapshot())
    current[ruleKey(kind, unitId, personneId)] = { pages: [...new Set(pages)] }
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
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, () => '{}')
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
