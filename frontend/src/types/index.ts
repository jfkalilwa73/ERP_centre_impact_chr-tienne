/**
 * Alias ergonomiques vers les schémas générés depuis openapi/openapi-phase-0.yaml.
 * Ne jamais redéfinir un DTO ici : le contrat OpenAPI fait autorité.
 */
import type { components } from './api'

type Schemas = components['schemas']

export type ErrorResponse = Schemas['ErrorResponse']
export type Pagination = Schemas['Pagination']

export type LoginRequest = Schemas['LoginRequest']
export type LoginResponse = Schemas['LoginResponse']
export type CurrentUser = Schemas['CurrentUser']

export type Personne = Schemas['Personne']
export type PersonneCreate = Schemas['PersonneCreate']
export type PersonneUpdate = Schemas['PersonneUpdate']
export type PersonneStatut = Schemas['PersonneStatut']
export type PersonnePage = Schemas['PersonnePage']

export type Compte = Schemas['Compte']
export type CompteCreate = Schemas['CompteCreate']
export type CompteUpdate = Schemas['CompteUpdate']
export type CompteStatut = Schemas['CompteStatut']
export type ComptePage = Schemas['ComptePage']

export type Role = Schemas['Role']
export type RoleCreate = Schemas['RoleCreate']
export type RoleUpdate = Schemas['RoleUpdate']
export type RolePage = Schemas['RolePage']

export type Permission = Schemas['Permission']
export type PermissionCreate = Schemas['PermissionCreate']
export type PermissionUpdate = Schemas['PermissionUpdate']
export type PermissionPage = Schemas['PermissionPage']
export type PermissionCheck = Schemas['PermissionCheck']

export type AffectationRole = Schemas['AffectationRole']
export type AffectationRoleCreate = Schemas['AffectationRoleCreate']
export type RolePermissionCreate = Schemas['RolePermissionCreate']

export type Site = Schemas['Site']
export type SiteCreate = Schemas['SiteCreate']
export type SiteUpdate = Schemas['SiteUpdate']
export type SitePage = Schemas['SitePage']

export type Departement = Schemas['Departement']
export type DepartementCreate = Schemas['DepartementCreate']
export type DepartementUpdate = Schemas['DepartementUpdate']
export type DepartementPage = Schemas['DepartementPage']

export type AffectationDepartement = Schemas['AffectationDepartement']
export type AffectationDepartementCreate = Schemas['AffectationDepartementCreate']

export type FamilleImpact = Schemas['FamilleImpact']
export type FamilleImpactCreate = Schemas['FamilleImpactCreate']
export type FamilleImpactUpdate = Schemas['FamilleImpactUpdate']
export type FamilleImpactPage = Schemas['FamilleImpactPage']

export type AffectationFamille = Schemas['AffectationFamille']
export type AffectationFamilleCreate = Schemas['AffectationFamilleCreate']

export type AuditLog = Schemas['AuditLog']
export type AuditLogPage = Schemas['AuditLogPage']
