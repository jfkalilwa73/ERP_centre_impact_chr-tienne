export const ROLES_FAMILLE = ['Chef', 'Adjoint', 'Membre'] as const

export type RoleFamille = (typeof ROLES_FAMILLE)[number]

export function roleFamille(fonction?: string): RoleFamille {
  const value = (fonction ?? '').trim().toLowerCase()
  if (!value) return 'Membre'
  if (value === 'chef' || value.includes('responsable')) return 'Chef'
  if (value.includes('adjoint')) return 'Adjoint'
  return 'Membre'
}

export function isLeadershipRole(fonction?: string) {
  const role = roleFamille(fonction)
  return role === 'Chef' || role === 'Adjoint'
}
