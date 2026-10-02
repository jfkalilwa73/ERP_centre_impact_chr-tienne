export const ROLES_DEPARTEMENT = ['Superviseur', 'Chef', 'Adjoint', 'Responsable', 'Membre'] as const

export type RoleDepartement = (typeof ROLES_DEPARTEMENT)[number]

/** Rôles que le chef attribue dans son équipe. */
export const ROLES_EQUIPE = ['Adjoint', 'Responsable'] as const

export type RoleEquipe = (typeof ROLES_EQUIPE)[number]

export function roleDepartement(fonction?: string): RoleDepartement {
  const value = (fonction ?? '').trim().toLowerCase()
  if (!value) return 'Membre'
  if (value.includes('superviseur')) return 'Superviseur'
  if (value.includes('adjoint')) return 'Adjoint'
  if (value === 'chef' || value.includes('chef de')) return 'Chef'
  if (value.includes('responsable')) return 'Responsable'
  return 'Membre'
}

export function isSupervisionRole(fonction?: string) {
  return roleDepartement(fonction) === 'Superviseur'
}

/** Chef et adjoint : pilotage de l’équipe (affectations, activités). */
export function isLeadershipRole(fonction?: string) {
  const role = roleDepartement(fonction)
  return role === 'Chef' || role === 'Adjoint'
}

export function isStructureRole(fonction?: string) {
  const role = roleDepartement(fonction)
  return role === 'Superviseur' || role === 'Chef'
}

/** Accès au tableau de bord d’un département affecté, y compris le superviseur. */
export function canAccessDepartementUnit(fonction?: string) {
  return isSupervisionRole(fonction) || isLeadershipRole(fonction)
}
