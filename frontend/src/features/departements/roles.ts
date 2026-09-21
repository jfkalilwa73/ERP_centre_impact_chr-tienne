export const ROLES_DEPARTEMENT = ['Chef', 'Adjoint', 'Membre'] as const

export type RoleDepartement = (typeof ROLES_DEPARTEMENT)[number]

export function roleDepartement(fonction?: string): RoleDepartement {
  const value = (fonction ?? '').trim().toLowerCase()
  if (!value) return 'Membre'
  if (value === 'chef' || value.includes('responsable')) return 'Chef'
  if (value.includes('adjoint')) return 'Adjoint'
  return 'Membre'
}

export function isLeadershipRole(fonction?: string) {
  const role = roleDepartement(fonction)
  return role === 'Chef' || role === 'Adjoint'
}
