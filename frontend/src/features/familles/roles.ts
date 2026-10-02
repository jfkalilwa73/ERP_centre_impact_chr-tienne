export const ROLES_FAMILLE = ['Superviseur', 'Chef', 'Adjoint', 'Responsable', 'Membre'] as const

export type RoleFamille = (typeof ROLES_FAMILLE)[number]

/** Rôles que le chef attribue dans sa famille. */
export const ROLES_EQUIPE_FAMILLE = ['Adjoint', 'Responsable'] as const

export type RoleEquipeFamille = (typeof ROLES_EQUIPE_FAMILLE)[number]

export function roleFamille(fonction?: string): RoleFamille {
  const value = (fonction ?? '').trim().toLowerCase()
  if (!value) return 'Membre'
  if (value.includes('superviseur')) return 'Superviseur'
  if (value.includes('adjoint')) return 'Adjoint'
  if (value === 'chef' || value.includes('chef de')) return 'Chef'
  if (value.includes('responsable')) return 'Responsable'
  return 'Membre'
}

export function isSupervisionRole(fonction?: string) {
  return roleFamille(fonction) === 'Superviseur'
}

export function isLeadershipRole(fonction?: string) {
  const role = roleFamille(fonction)
  return role === 'Chef' || role === 'Adjoint'
}

export function isStructureRole(fonction?: string) {
  const role = roleFamille(fonction)
  return role === 'Superviseur' || role === 'Chef'
}

export function canAccessFamilleUnit(fonction?: string) {
  return isSupervisionRole(fonction) || isLeadershipRole(fonction)
}
