export const ROLES_DEPARTEMENT = ['Superviseur', 'Chef', 'Adjoint', 'Membre'] as const

export type RoleDepartement = (typeof ROLES_DEPARTEMENT)[number]

export function roleDepartement(fonction?: string): RoleDepartement {
  const value = (fonction ?? '').trim().toLowerCase()
  if (!value) return 'Membre'
  if (value.includes('superviseur')) return 'Superviseur'
  if (value === 'chef' || value.includes('responsable')) return 'Chef'
  if (value.includes('adjoint')) return 'Adjoint'
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

/** Accès au tableau de bord d’un département affecté, y compris le superviseur. */
export function canAccessDepartementUnit(fonction?: string) {
  return isSupervisionRole(fonction) || isLeadershipRole(fonction)
}
