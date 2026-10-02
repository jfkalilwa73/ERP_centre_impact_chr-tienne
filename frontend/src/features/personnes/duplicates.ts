import type { Personne } from '@/types'

export type DuplicateReason = 'nom' | 'telephone'

export type DuplicateGroup = {
  id: string
  reasons: DuplicateReason[]
  personnes: Personne[]
}

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}

function identityKey(personne: Personne) {
  return `${normalizeName(personne.prenom)} ${normalizeName(personne.nom)}`
}

class UnionFind {
  private parent = new Map<string, string>()

  add(id: string) {
    if (!this.parent.has(id)) this.parent.set(id, id)
  }

  find(id: string): string {
    const parent = this.parent.get(id) ?? id
    if (parent === id) return id
    const root = this.find(parent)
    this.parent.set(id, root)
    return root
  }

  union(left: string, right: string) {
    const rootLeft = this.find(left)
    const rootRight = this.find(right)
    if (rootLeft !== rootRight) this.parent.set(rootRight, rootLeft)
  }
}

/**
 * Regroupe les profils qui partagent le même nom+prénom ou le même téléphone.
 * Les groupes qui se recoupent sont fusionnés (ex. homonyme + même numéro).
 */
export function findDuplicateGroups(personnes: Personne[]): DuplicateGroup[] {
  const uf = new UnionFind()
  const reasons = new Map<string, Set<DuplicateReason>>()

  personnes.forEach((personne) => uf.add(personne.idPersonne))

  const mark = (ids: string[], reason: DuplicateReason) => {
    if (ids.length < 2) return
    ids.slice(1).forEach((id) => uf.union(ids[0]!, id))
    ids.forEach((id) => {
      const bucket = reasons.get(id) ?? new Set<DuplicateReason>()
      bucket.add(reason)
      reasons.set(id, bucket)
    })
  }

  const byName = new Map<string, string[]>()
  const byPhone = new Map<string, string[]>()

  for (const personne of personnes) {
    const nameKey = identityKey(personne)
    if (nameKey) {
      const list = byName.get(nameKey) ?? []
      list.push(personne.idPersonne)
      byName.set(nameKey, list)
    }

    if (personne.telephone) {
      const phoneKey = normalizePhone(personne.telephone)
      if (phoneKey.length >= 8) {
        const list = byPhone.get(phoneKey) ?? []
        list.push(personne.idPersonne)
        byPhone.set(phoneKey, list)
      }
    }
  }

  for (const ids of byName.values()) mark(ids, 'nom')
  for (const ids of byPhone.values()) mark(ids, 'telephone')

  const grouped = new Map<string, Personne[]>()
  for (const personne of personnes) {
    if (!reasons.has(personne.idPersonne)) continue
    const root = uf.find(personne.idPersonne)
    const list = grouped.get(root) ?? []
    list.push(personne)
    grouped.set(root, list)
  }

  return [...grouped.entries()]
    .map(([id, members]) => ({
      id,
      personnes: members,
      reasons: [...new Set(members.flatMap((member) => [...(reasons.get(member.idPersonne) ?? [])]))],
    }))
    .filter((group) => group.personnes.length > 1)
    .sort((left, right) => right.personnes.length - left.personnes.length)
}

export function countDuplicateProfiles(groups: DuplicateGroup[]) {
  return new Set(groups.flatMap((group) => group.personnes.map((personne) => personne.idPersonne)))
    .size
}

export function isThisMonth(isoDate: string, now = new Date()) {
  const date = new Date(isoDate)
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

export function initials(personne: Pick<Personne, 'nom' | 'prenom'>) {
  return `${personne.prenom.at(0) ?? ''}${personne.nom.at(0) ?? ''}`.toUpperCase()
}

export const duplicateReasonLabels: Record<DuplicateReason, string> = {
  nom: 'Même nom et prénom',
  telephone: 'Même numéro de téléphone',
}

export function matchesPersonneSearch(personne: Personne, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [personne.nom, personne.prenom, personne.telephone ?? '']
    .join(' ')
    .toLowerCase()
    .includes(needle)
}
