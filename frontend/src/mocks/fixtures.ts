import type {
  AffectationDepartement,
  AffectationRole,
  AuditLog,
  Compte,
  CurrentUser,
  Departement,
  Permission,
  Personne,
  Role,
  Site,
} from '@/types'
import { PERMISSIONS } from '@/lib/permissions'

/**
 * Jeu de données de démonstration, calqué sur les schémas du contrat Phase 0.
 * Sert uniquement au mode mock : aucune donnée réelle ici.
 */
export const seedPermissions: Permission[] = [
  {
    idPermission: '6f1a2c10-0001-4000-8000-000000000001',
    code: PERMISSIONS.MEMBRES_READ,
    module: 'membres',
    action: 'read',
    description: 'Consulter les personnes',
    actif: true,
  },
  {
    idPermission: '6f1a2c10-0001-4000-8000-000000000002',
    code: PERMISSIONS.MEMBRES_CREATE,
    module: 'membres',
    action: 'create',
    description: 'Créer une personne',
    actif: true,
  },
  {
    idPermission: '6f1a2c10-0001-4000-8000-00000000000e',
    code: PERMISSIONS.MEMBRES_UPDATE,
    module: 'membres',
    action: 'update',
    description: 'Modifier une personne',
    actif: true,
  },
  {
    idPermission: '6f1a2c10-0001-4000-8000-00000000000f',
    code: PERMISSIONS.MEMBRES_DELETE,
    module: 'membres',
    action: 'delete',
    description: 'Supprimer une personne inactive',
    actif: true,
  },
  {
    idPermission: '6f1a2c10-0001-4000-8000-000000000006',
    code: PERMISSIONS.COMPTES_READ,
    module: 'comptes',
    action: 'read',
    description: 'Consulter les comptes',
    actif: true,
  },
  {
    idPermission: '6f1a2c10-0001-4000-8000-000000000010',
    code: PERMISSIONS.COMPTES_CREATE,
    module: 'comptes',
    action: 'create',
    description: 'Créer un compte',
    actif: true,
  },
  {
    idPermission: '6f1a2c10-0001-4000-8000-000000000011',
    code: PERMISSIONS.COMPTES_UPDATE,
    module: 'comptes',
    action: 'update',
    description: 'Modifier un compte',
    actif: true,
  },
  {
    idPermission: '6f1a2c10-0001-4000-8000-000000000012',
    code: PERMISSIONS.COMPTES_DELETE,
    module: 'comptes',
    action: 'delete',
    description: 'Supprimer un compte non actif',
    actif: true,
  },
  {
    idPermission: '6f1a2c10-0001-4000-8000-000000000003',
    code: PERMISSIONS.SITES_READ,
    module: 'sites',
    action: 'read',
    description: 'Consulter les sites',
    actif: true,
  },
  {
    idPermission: '6f1a2c10-0001-4000-8000-000000000007',
    code: PERMISSIONS.SITES_CREATE,
    module: 'sites',
    action: 'create',
    description: 'Créer un site',
    actif: true,
  },
  {
    idPermission: '6f1a2c10-0001-4000-8000-000000000008',
    code: PERMISSIONS.SITES_UPDATE,
    module: 'sites',
    action: 'update',
    description: 'Modifier un site',
    actif: true,
  },
  {
    idPermission: '6f1a2c10-0001-4000-8000-000000000009',
    code: PERMISSIONS.SITES_DELETE,
    module: 'sites',
    action: 'delete',
    description: 'Supprimer un site non utilisé',
    actif: true,
  },
  {
    idPermission: '6f1a2c10-0001-4000-8000-00000000000a',
    code: PERMISSIONS.DEPARTEMENTS_READ,
    module: 'departements',
    action: 'read',
    description: 'Consulter les départements',
    actif: true,
  },
  {
    idPermission: '6f1a2c10-0001-4000-8000-00000000000b',
    code: PERMISSIONS.DEPARTEMENTS_CREATE,
    module: 'departements',
    action: 'create',
    description: 'Créer un département',
    actif: true,
  },
  {
    idPermission: '6f1a2c10-0001-4000-8000-00000000000c',
    code: PERMISSIONS.DEPARTEMENTS_UPDATE,
    module: 'departements',
    action: 'update',
    description: 'Modifier un département',
    actif: true,
  },
  {
    idPermission: '6f1a2c10-0001-4000-8000-00000000000d',
    code: PERMISSIONS.DEPARTEMENTS_DELETE,
    module: 'departements',
    action: 'delete',
    description: 'Supprimer un département non utilisé',
    actif: true,
  },
  {
    idPermission: '6f1a2c10-0001-4000-8000-000000000004',
    code: PERMISSIONS.ROLES_MANAGE,
    module: 'roles',
    action: 'manage',
    description: 'Administrer les rôles et les permissions',
    actif: true,
  },
  {
    idPermission: '6f1a2c10-0001-4000-8000-000000000005',
    code: PERMISSIONS.AUDIT_READ,
    module: 'audit',
    action: 'read',
    description: "Consulter les traces d'audit",
    actif: true,
  },
]

const adminRole: Role = {
  idRole: '2b9d4f60-0002-4000-8000-000000000001',
  code: 'ADMIN_FONCTIONNEL',
  nom: 'Administrateur fonctionnel',
  description: 'Accès complet au socle transverse de la Phase 0.',
  niveauConfidentialite: 3,
  actif: true,
  dateCreation: '2026-01-05T08:00:00Z',
}

const accueilRole: Role = {
  idRole: '2b9d4f60-0002-4000-8000-000000000002',
  code: 'RESPONSABLE_ACCUEIL',
  nom: 'Responsable accueil',
  description: "Consultation des membres du site d'affectation.",
  niveauConfidentialite: 1,
  actif: true,
  dateCreation: '2026-01-05T08:00:00Z',
}

const pasteurRole: Role = {
  idRole: '2b9d4f60-0002-4000-8000-000000000003',
  code: 'PASTEUR_SITE',
  nom: 'Pasteur de site',
  description: 'Consultation des personnes, sans administration de la structure.',
  niveauConfidentialite: 1,
  actif: true,
  dateCreation: '2026-03-01T08:00:00Z',
}

export const seedRoles: Role[] = [adminRole, accueilRole, pasteurRole]

export type RolePermissionLink = {
  idRole: string
  idPermission: string
}

function permissionLinks(role: Role, codes: string[]): RolePermissionLink[] {
  return seedPermissions
    .filter((permission) => codes.includes(permission.code))
    .map((permission) => ({ idRole: role.idRole, idPermission: permission.idPermission }))
}

export const seedRolePermissions: RolePermissionLink[] = [
  ...seedPermissions.map((permission) => ({
    idRole: adminRole.idRole,
    idPermission: permission.idPermission,
  })),
  ...permissionLinks(accueilRole, [
    PERMISSIONS.MEMBRES_READ,
    PERMISSIONS.SITES_READ,
    PERMISSIONS.DEPARTEMENTS_READ,
  ]),
  ...permissionLinks(pasteurRole, [PERMISSIONS.MEMBRES_READ]),
]

export type MockAccount = {
  motDePasse: string
  utilisateur: CurrentUser
}

const seedAccounts: MockAccount[] = [
  {
    motDePasse: 'SecurePass123!',
    utilisateur: {
      compte: {
        idCompte: 'a1c3e5f7-0003-4000-8000-000000000001',
        idPersonne: 'b2d4f6a8-0004-4000-8000-000000000001',
        email: 'admin@eglise.org',
        statut: 'actif',
        mfaActive: false,
        derniereConnexion: '2026-09-16T18:42:00Z',
        dateCreation: '2026-01-05T08:00:00Z',
      },
      personne: {
        idPersonne: 'b2d4f6a8-0004-4000-8000-000000000001',
        nom: 'KABILA',
        prenom: 'Jean',
        dateNaissance: '1985-04-22',
        sexe: 'M',
        telephone: '+243810000000',
        adresse: 'Kinshasa',
        statut: 'actif',
        dateCreation: '2026-01-05T08:00:00Z',
        dateModification: '2026-06-11T10:15:00Z',
      },
      roles: [adminRole],
      permissions: seedPermissions.map((permission) => permission.code),
    },
  },
  {
    motDePasse: 'Accueil2026!',
    utilisateur: {
      compte: {
        idCompte: 'a1c3e5f7-0003-4000-8000-000000000002',
        idPersonne: 'b2d4f6a8-0004-4000-8000-000000000002',
        email: 'accueil@eglise.org',
        statut: 'actif',
        mfaActive: false,
        dateCreation: '2026-02-18T09:30:00Z',
      },
      personne: {
        idPersonne: 'b2d4f6a8-0004-4000-8000-000000000002',
        nom: 'MUKENDI',
        prenom: 'Grâce',
        sexe: 'F',
        telephone: '+243810000002',
        statut: 'actif',
        dateCreation: '2026-02-18T09:30:00Z',
        dateModification: '2026-02-18T09:30:00Z',
      },
      roles: [accueilRole],
      permissions: [PERMISSIONS.MEMBRES_READ, PERMISSIONS.SITES_READ, PERMISSIONS.DEPARTEMENTS_READ],
    },
  },
  {
    motDePasse: 'Pasteur2026!',
    utilisateur: {
      compte: {
        idCompte: 'a1c3e5f7-0003-4000-8000-000000000003',
        idPersonne: 'b2d4f6a8-0004-4000-8000-000000000003',
        email: 'pasteur@eglise.org',
        statut: 'actif',
        mfaActive: false,
        dateCreation: '2026-03-01T08:00:00Z',
      },
      personne: {
        idPersonne: 'b2d4f6a8-0004-4000-8000-000000000003',
        nom: 'KALONJI',
        prenom: 'Paul',
        sexe: 'M',
        telephone: '+243810000003',
        statut: 'actif',
        dateCreation: '2026-03-01T08:00:00Z',
        dateModification: '2026-03-01T08:00:00Z',
      },
      roles: [pasteurRole],
      permissions: [PERMISSIONS.MEMBRES_READ],
    },
  },
]

/**
 * Copie vivante des comptes de connexion : les handlers la modifient
 * (e-mail, statut, personne liée). `resetMockDb` la remet à l'état du seed.
 */
export const mockAccounts: MockAccount[] = structuredClone(seedAccounts)

export function resetMockAccounts() {
  mockAccounts.splice(0, mockAccounts.length, ...structuredClone(seedAccounts))
}

/** Compte suspendu : permet de tester le 403 du contrat. */
export const suspendedAccountEmail = 'suspendu@eglise.org'

export type MockSite = Site

export const seedSites: MockSite[] = [
  {
    idSite: 'c3e5a7b9-0005-4000-8000-000000000001',
    code: 'KIN-CENTRE',
    nom: 'Site central',
    adresse: "Avenue de l'Église",
    ville: 'Kinshasa',
    pays: 'RDC',
    telephone: '+243810000001',
    actif: true,
    dateCreation: '2026-01-10T08:00:00Z',
  },
  {
    idSite: 'c3e5a7b9-0005-4000-8000-000000000002',
    code: 'KIN-LIMETE',
    nom: 'Site Limete',
    adresse: 'Boulevard Lumumba',
    ville: 'Kinshasa',
    pays: 'RDC',
    telephone: '+243810000010',
    actif: true,
    dateCreation: '2026-03-22T08:00:00Z',
  },
  {
    idSite: 'c3e5a7b9-0005-4000-8000-000000000003',
    code: 'LUB-CENTRE',
    nom: 'Site Lubumbashi',
    adresse: 'Avenue Kapenda',
    ville: 'Lubumbashi',
    pays: 'RDC',
    telephone: '+243810000020',
    actif: false,
    dateCreation: '2026-05-02T08:00:00Z',
  },
]

export type MockDepartement = Departement

export const seedDepartements: MockDepartement[] = [
  {
    idDepartement: 'd4f6b8c0-0006-4000-8000-000000000001',
    code: 'ACCUEIL',
    nom: 'Département Accueil',
    mission: 'Accueillir les membres et les visiteurs.',
    idSite: 'c3e5a7b9-0005-4000-8000-000000000001',
    actif: true,
    dateCreation: '2026-01-12T08:00:00Z',
  },
  {
    idDepartement: 'd4f6b8c0-0006-4000-8000-000000000002',
    code: 'LOUANGE',
    nom: 'Département Louange',
    mission: 'Préparer et conduire le culte.',
    idSite: 'c3e5a7b9-0005-4000-8000-000000000001',
    actif: true,
    dateCreation: '2026-01-15T08:00:00Z',
  },
  {
    idDepartement: 'd4f6b8c0-0006-4000-8000-000000000003',
    code: 'DIAKONIE',
    nom: 'Département Diaconie',
    idSite: 'c3e5a7b9-0005-4000-8000-000000000001',
    actif: false,
    dateCreation: '2026-02-01T08:00:00Z',
  },
]

export const seedPersonnes: Personne[] = [
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000001',
    nom: 'KABILA',
    prenom: 'Jean',
    dateNaissance: '1985-04-22',
    sexe: 'M',
    telephone: '+243810000000',
    adresse: 'Kinshasa',
    statut: 'actif',
    dateCreation: '2026-01-05T08:00:00Z',
    dateModification: '2026-06-11T10:15:00Z',
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000002',
    nom: 'MUKENDI',
    prenom: 'Grâce',
    sexe: 'F',
    telephone: '+243810000002',
    statut: 'actif',
    dateCreation: '2026-02-18T09:30:00Z',
    dateModification: '2026-02-18T09:30:00Z',
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000003',
    nom: 'KALONJI',
    prenom: 'Paul',
    sexe: 'M',
    telephone: '+243810000003',
    statut: 'actif',
    dateCreation: '2026-03-01T08:00:00Z',
    dateModification: '2026-03-01T08:00:00Z',
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000004',
    nom: 'TSHISEKEDI',
    prenom: 'Marie',
    sexe: 'F',
    telephone: '+243810000004',
    statut: 'inactif',
    dateCreation: '2025-11-02T08:00:00Z',
    dateModification: '2026-07-01T08:00:00Z',
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000005',
    nom: 'ILUNGA',
    prenom: 'David',
    sexe: 'M',
    statut: 'archive',
    dateCreation: '2024-09-14T08:00:00Z',
    dateModification: '2026-01-20T08:00:00Z',
  },
  /** Membre sans accès de connexion : le cas le plus courant. */
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000006',
    nom: 'NGOY',
    prenom: 'Ruth',
    sexe: 'F',
    telephone: '+243810000006',
    statut: 'actif',
    dateCreation: '2026-04-08T08:00:00Z',
    dateModification: '2026-04-08T08:00:00Z',
  },
  /** Trio volontairement ambigu pour la détection de doublons. */
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000007',
    nom: 'MWAMBA',
    prenom: 'Pierre',
    sexe: 'M',
    telephone: '+243810000070',
    statut: 'actif',
    dateCreation: '2026-09-10T08:00:00Z',
    dateModification: '2026-09-10T08:00:00Z',
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000008',
    nom: 'MWAMBA',
    prenom: 'Pierre',
    sexe: 'M',
    telephone: '+243810000071',
    statut: 'actif',
    dateCreation: '2026-09-12T08:00:00Z',
    dateModification: '2026-09-12T08:00:00Z',
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000009',
    nom: 'MWAMBA',
    prenom: 'Patrick',
    sexe: 'M',
    telephone: '+243810000070',
    statut: 'actif',
    dateCreation: '2026-09-15T08:00:00Z',
    dateModification: '2026-09-15T08:00:00Z',
  },
]

export const seedComptes: Compte[] = [
  {
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000001',
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000001',
    email: 'admin@eglise.org',
    statut: 'actif',
    mfaActive: false,
    derniereConnexion: '2026-09-16T18:42:00Z',
    dateCreation: '2026-01-05T08:00:00Z',
  },
  {
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000002',
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000002',
    email: 'accueil@eglise.org',
    statut: 'actif',
    mfaActive: false,
    dateCreation: '2026-02-18T09:30:00Z',
  },
  {
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000003',
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000003',
    email: 'pasteur@eglise.org',
    statut: 'actif',
    mfaActive: true,
    dateCreation: '2026-03-01T08:00:00Z',
  },
  {
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000004',
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000004',
    email: 'marie@eglise.org',
    statut: 'suspendu',
    mfaActive: false,
    dateCreation: '2025-11-02T08:00:00Z',
  },
  {
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000005',
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000005',
    email: 'david@eglise.org',
    statut: 'desactive',
    mfaActive: false,
    dateCreation: '2024-09-14T08:00:00Z',
    dateDesactivation: '2026-01-20T08:00:00Z',
  },
]

export const seedAffectationsRole: AffectationRole[] = [
  {
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000001',
    idRole: adminRole.idRole,
    dateDebut: '2026-01-05T08:00:00Z',
    actif: true,
  },
  {
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000002',
    idRole: accueilRole.idRole,
    dateDebut: '2026-02-18T09:30:00Z',
    actif: true,
  },
  {
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000003',
    idRole: pasteurRole.idRole,
    dateDebut: '2026-03-01T08:00:00Z',
    actif: true,
  },
]

export const seedAffectations: AffectationDepartement[] = [
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000001',
    idDepartement: 'd4f6b8c0-0006-4000-8000-000000000001',
    fonction: 'Responsable accueil',
    dateDebut: '2026-01-12T08:00:00Z',
    actif: true,
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000002',
    idDepartement: 'd4f6b8c0-0006-4000-8000-000000000001',
    fonction: 'Accueillante',
    dateDebut: '2026-02-18T09:30:00Z',
    actif: true,
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000007',
    idDepartement: 'd4f6b8c0-0006-4000-8000-000000000002',
    fonction: 'Choriste',
    dateDebut: '2026-09-10T08:00:00Z',
    actif: true,
  },
]

function auditSnapshot(value: Record<string, unknown>): AuditLog['anciennesValeurs'] {
  return value as AuditLog['anciennesValeurs']
}

export const seedAuditLogs: AuditLog[] = [
  {
    idAudit: 'e7a9c1d3-0007-4000-8000-000000000001',
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000001',
    action: 'PERSONNE_CREATED',
    entiteType: 'personne',
    idEntite: 'b2d4f6a8-0004-4000-8000-000000000001',
    nouvellesValeurs: auditSnapshot({ nom: 'KABILA', prenom: 'Jean', statut: 'actif' }),
    adresseIp: '192.0.2.10',
    userAgent: 'Mozilla/5.0',
    dateAction: '2026-01-05T08:00:00Z',
  },
  {
    idAudit: 'e7a9c1d3-0007-4000-8000-000000000002',
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000001',
    action: 'COMPTE_CREATED',
    entiteType: 'compte',
    idEntite: 'a1c3e5f7-0003-4000-8000-000000000001',
    nouvellesValeurs: auditSnapshot({ email: 'admin@eglise.org', statut: 'actif' }),
    adresseIp: '192.0.2.10',
    userAgent: 'Mozilla/5.0',
    dateAction: '2026-01-05T08:01:00Z',
  },
  {
    idAudit: 'e7a9c1d3-0007-4000-8000-000000000003',
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000001',
    action: 'ROLE_ASSIGNED',
    entiteType: 'affectation_role',
    idEntite: 'a1c3e5f7-0003-4000-8000-000000000001',
    nouvellesValeurs: auditSnapshot({
      idCompte: 'a1c3e5f7-0003-4000-8000-000000000001',
      idRole: adminRole.idRole,
    }),
    adresseIp: '192.0.2.10',
    userAgent: 'Mozilla/5.0',
    dateAction: '2026-01-05T08:02:00Z',
  },
  {
    idAudit: 'e7a9c1d3-0007-4000-8000-000000000004',
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000001',
    action: 'SITE_CREATED',
    entiteType: 'site',
    idEntite: 'c3e5a7b9-0005-4000-8000-000000000001',
    nouvellesValeurs: auditSnapshot({ code: 'KIN-CENTRE', nom: 'Site central' }),
    adresseIp: '192.0.2.10',
    userAgent: 'Mozilla/5.0',
    dateAction: '2026-01-10T08:00:00Z',
  },
  {
    idAudit: 'e7a9c1d3-0007-4000-8000-000000000005',
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000001',
    action: 'DEPARTEMENT_CREATED',
    entiteType: 'departement',
    idEntite: 'd4f6b8c0-0006-4000-8000-000000000001',
    nouvellesValeurs: auditSnapshot({ code: 'ACCUEIL', nom: 'Département Accueil' }),
    adresseIp: '192.0.2.10',
    userAgent: 'Mozilla/5.0',
    dateAction: '2026-01-12T08:00:00Z',
  },
  {
    idAudit: 'e7a9c1d3-0007-4000-8000-000000000006',
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000001',
    action: 'PERSONNE_UPDATED',
    entiteType: 'personne',
    idEntite: 'b2d4f6a8-0004-4000-8000-000000000001',
    anciennesValeurs: auditSnapshot({ adresse: null }),
    nouvellesValeurs: auditSnapshot({ adresse: 'Kinshasa' }),
    adresseIp: '192.0.2.11',
    userAgent: 'Mozilla/5.0',
    dateAction: '2026-06-11T10:15:00Z',
  },
  {
    idAudit: 'e7a9c1d3-0007-4000-8000-000000000007',
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000001',
    action: 'SITE_UPDATED',
    entiteType: 'site',
    idEntite: 'c3e5a7b9-0005-4000-8000-000000000003',
    anciennesValeurs: auditSnapshot({ actif: true }),
    nouvellesValeurs: auditSnapshot({ actif: false }),
    adresseIp: '192.0.2.11',
    userAgent: 'Mozilla/5.0',
    dateAction: '2026-07-02T09:20:00Z',
  },
  {
    idAudit: 'e7a9c1d3-0007-4000-8000-000000000008',
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000001',
    action: 'PERMISSION_ASSIGNED',
    entiteType: 'role',
    idEntite: pasteurRole.idRole,
    nouvellesValeurs: auditSnapshot({ permission: PERMISSIONS.MEMBRES_READ }),
    adresseIp: '192.0.2.11',
    userAgent: 'Mozilla/5.0',
    dateAction: '2026-03-01T08:10:00Z',
  },
]
