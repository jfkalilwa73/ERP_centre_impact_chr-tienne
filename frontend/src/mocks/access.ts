import { canAccessDepartementUnit } from '@/features/departements/roles'
import { isLeadershipRole as isFamilleLeadership } from '@/features/familles/roles'
import { PERMISSIONS } from '@/lib/permissions'
import { mockDb } from './db'
import { mockAccounts, type MockAccount } from './fixtures'
import { requirePermission } from './http'

export function effectivePermissionsForCompte(idCompte: string) {
  const roleIds = mockDb.affectationsRole
    .filter((affectation) => affectation.idCompte === idCompte && affectation.actif)
    .map((affectation) => affectation.idRole)
  const permissionIds = new Set(
    mockDb.rolePermissions
      .filter((lien) => roleIds.includes(lien.idRole))
      .map((lien) => lien.idPermission),
  )
  return mockDb.permissions
    .filter((permission) => permissionIds.has(permission.idPermission) && permission.actif)
    .map((permission) => permission.code)
}

/** Recalcule rôles et permissions d'un compte à partir des affectations actives. */
export function refreshAccountAccess(idCompte: string) {
  const account = mockAccounts.find(
    (candidate) => candidate.utilisateur.compte.idCompte === idCompte,
  )
  if (!account) return

  const roleIds = mockDb.affectationsRole
    .filter((affectation) => affectation.idCompte === idCompte && affectation.actif)
    .map((affectation) => affectation.idRole)

  account.utilisateur.roles = mockDb.roles.filter(
    (role) => roleIds.includes(role.idRole) && role.actif,
  )
  account.utilisateur.permissions = effectivePermissionsForCompte(idCompte)
}

export function leadsDepartement(account: MockAccount, departementId?: string) {
  const idPersonne = account.utilisateur.compte.idPersonne
  return mockDb.affectations.some(
    (affectation) =>
      affectation.idPersonne === idPersonne &&
      affectation.actif &&
      canAccessDepartementUnit(affectation.fonction) &&
      (!departementId || affectation.idDepartement === departementId),
  )
}

export function leadsFamille(account: MockAccount, familleId?: string) {
  const idPersonne = account.utilisateur.compte.idPersonne
  return mockDb.affectationsFamille.some(
    (affectation) =>
      affectation.idPersonne === idPersonne &&
      affectation.actif &&
      isFamilleLeadership(affectation.fonction) &&
      (!familleId || affectation.idFamille === familleId),
  )
}

export function isAnyLeadership(account: MockAccount) {
  return leadsDepartement(account) || leadsFamille(account)
}

export function canReadPersonnes(account: MockAccount) {
  return requirePermission(account, PERMISSIONS.MEMBRES_READ) || isAnyLeadership(account)
}

export function canReadRoles(account: MockAccount) {
  return (
    requirePermission(account, PERMISSIONS.ROLES_MANAGE) ||
    requirePermission(account, PERMISSIONS.ROLES_READ)
  )
}
