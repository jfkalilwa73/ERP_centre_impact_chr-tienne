import { canSeeAllUnits as canSeeAllUnitsForUser } from '@/features/auth/orgRoles'
import { canAccessDepartementUnit } from '@/features/departements/roles'
import { canAccessFamilleUnit } from '@/features/familles/roles'
import { PERMISSIONS } from '@/lib/permissions'
import { mockDb } from './db'
import { mockAccounts, type MockAccount } from './fixtures'
import { requirePermission } from './http'

export function effectivePermissionsForCompte(idCompte: string) {
  const compte = mockDb.comptes.find((candidate) => candidate.idCompte === idCompte)
  if (!compte || compte.statut !== 'actif') return []

  const roleIds = mockDb.affectationsRole
    .filter((affectation) => affectation.idCompte === idCompte && affectation.actif)
    .map((affectation) => affectation.idRole)
  const activeRoleIds = new Set(
    mockDb.roles
      .filter((role) => roleIds.includes(role.idRole) && role.actif)
      .map((role) => role.idRole),
  )
  const permissionIds = new Set(
    mockDb.rolePermissions
      .filter((lien) => activeRoleIds.has(lien.idRole))
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

export function refreshAccountsHoldingRole(idRole: string) {
  const compteIds = new Set(
    mockDb.affectationsRole
      .filter((affectation) => affectation.actif && affectation.idRole === idRole)
      .map((affectation) => affectation.idCompte),
  )
  for (const idCompte of compteIds) refreshAccountAccess(idCompte)
}

export function refreshAccountsHoldingPermission(idPermission: string) {
  const roleIds = mockDb.rolePermissions
    .filter((lien) => lien.idPermission === idPermission)
    .map((lien) => lien.idRole)
  const compteIds = new Set(
    mockDb.affectationsRole
      .filter((affectation) => affectation.actif && roleIds.includes(affectation.idRole))
      .map((affectation) => affectation.idCompte),
  )
  for (const idCompte of compteIds) refreshAccountAccess(idCompte)
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
      canAccessFamilleUnit(affectation.fonction) &&
      (!familleId || affectation.idFamille === familleId),
  )
}

export function canSeeAllUnits(account: MockAccount) {
  return canSeeAllUnitsForUser(account.utilisateur)
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
