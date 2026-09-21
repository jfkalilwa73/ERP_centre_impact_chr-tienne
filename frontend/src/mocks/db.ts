import {
  seedAffectations,
  seedAffectationsRole,
  seedAuditLogs,
  seedComptes,
  seedDepartements,
  seedPermissions,
  seedPersonnes,
  seedRolePermissions,
  seedRoles,
  seedSites,
  resetMockAccounts,
  type MockDepartement,
  type MockSite,
  type RolePermissionLink,
} from './fixtures'
import type {
  AffectationDepartement,
  AffectationRole,
  AuditLog,
  Compte,
  Permission,
  Personne,
  Role,
} from '@/types'

type MockDb = {
  sites: MockSite[]
  departements: MockDepartement[]
  personnes: Personne[]
  affectations: AffectationDepartement[]
  comptes: Compte[]
  roles: Role[]
  affectationsRole: AffectationRole[]
  permissions: Permission[]
  rolePermissions: RolePermissionLink[]
  auditLogs: AuditLog[]
}

function cloneSeed(): MockDb {
  return {
    sites: structuredClone(seedSites),
    departements: structuredClone(seedDepartements),
    personnes: structuredClone(seedPersonnes),
    affectations: structuredClone(seedAffectations),
    comptes: structuredClone(seedComptes),
    roles: structuredClone(seedRoles),
    affectationsRole: structuredClone(seedAffectationsRole),
    permissions: structuredClone(seedPermissions),
    rolePermissions: structuredClone(seedRolePermissions),
    auditLogs: structuredClone(seedAuditLogs),
  }
}

export const mockDb: MockDb = cloneSeed()

export function resetMockDb() {
  const next = cloneSeed()
  mockDb.sites.splice(0, mockDb.sites.length, ...next.sites)
  mockDb.departements.splice(0, mockDb.departements.length, ...next.departements)
  mockDb.personnes.splice(0, mockDb.personnes.length, ...next.personnes)
  mockDb.affectations.splice(0, mockDb.affectations.length, ...next.affectations)
  mockDb.comptes.splice(0, mockDb.comptes.length, ...next.comptes)
  mockDb.roles.splice(0, mockDb.roles.length, ...next.roles)
  mockDb.affectationsRole.splice(0, mockDb.affectationsRole.length, ...next.affectationsRole)
  mockDb.permissions.splice(0, mockDb.permissions.length, ...next.permissions)
  mockDb.rolePermissions.splice(0, mockDb.rolePermissions.length, ...next.rolePermissions)
  mockDb.auditLogs.splice(0, mockDb.auditLogs.length, ...next.auditLogs)
  resetMockAccounts()
}

export function appendAuditLog(
  entry: Omit<AuditLog, 'idAudit' | 'dateAction'> & Partial<Pick<AuditLog, 'idAudit' | 'dateAction'>>,
) {
  mockDb.auditLogs.unshift({
    idAudit: entry.idAudit ?? crypto.randomUUID(),
    dateAction: entry.dateAction ?? new Date().toISOString(),
    action: entry.action,
    entiteType: entry.entiteType,
    idEntite: entry.idEntite,
    idCompte: entry.idCompte,
    anciennesValeurs: entry.anciennesValeurs,
    nouvellesValeurs: entry.nouvellesValeurs,
    adresseIp: entry.adresseIp ?? '127.0.0.1',
    userAgent: entry.userAgent ?? 'MSW',
  })
}
