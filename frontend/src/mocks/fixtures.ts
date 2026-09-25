import type {
  AffectationDepartement,
  AffectationFamille,
  AffectationRole,
  AuditLog,
  Compte,
  CurrentUser,
  Departement,
  FamilleImpact,
  Personne,
  Site,
} from '@/types'
import { PERMISSIONS } from '@/lib/permissions'
import {
  accueilRole,
  adminFonctionnelPermissionCodes,
  adminRole,
  chefDepartementRole,
  chefFamilleRole,
  membreDgeRole,
  pasteurPermissionCodes,
  pasteurRole,
  permissionCodesForRole,
  superviseurRole,
  seedPermissions,
  seedRolePermissions,
  seedRoles,
} from './rbac'

export {
  accueilRole,
  adminRole,
  chefDepartementRole,
  chefFamilleRole,
  pasteurRole,
  superviseurRole,
  seedPermissions,
  seedRolePermissions,
  seedRoles,
}
export type { RolePermissionLink } from './rbac'

/**
 * Jeu de données de démonstration, calqué sur les schémas du contrat Phase 0.
 * Rôles et permissions : `rbac.ts`.
 */

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
      permissions: adminFonctionnelPermissionCodes,
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
      permissions: [
        PERMISSIONS.MEMBRES_READ,
        PERMISSIONS.SITES_READ,
        PERMISSIONS.DEPARTEMENTS_READ,
        PERMISSIONS.FAMILLES_READ,
      ],
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
      permissions: pasteurPermissionCodes,
    },
  },
  {
    motDePasse: 'ChefDep2026!',
    utilisateur: {
      compte: {
        idCompte: 'a1c3e5f7-0003-4000-8000-000000000006',
        idPersonne: 'b2d4f6a8-0004-4000-8000-000000000007',
        email: 'chef-louange@eglise.org',
        statut: 'actif',
        mfaActive: false,
        dateCreation: '2026-04-01T08:00:00Z',
      },
      personne: {
        idPersonne: 'b2d4f6a8-0004-4000-8000-000000000007',
        nom: 'MWAMBA',
        prenom: 'Pierre',
        sexe: 'M',
        telephone: '+243810000070',
        statut: 'actif',
        dateCreation: '2026-09-10T08:00:00Z',
        dateModification: '2026-09-10T08:00:00Z',
      },
      roles: [chefDepartementRole],
      permissions: permissionCodesForRole(chefDepartementRole.idRole),
    },
  },
  {
    motDePasse: 'ChefFamille2026!',
    utilisateur: {
      compte: {
        idCompte: 'a1c3e5f7-0003-4000-8000-000000000007',
        idPersonne: 'b2d4f6a8-0004-4000-8000-000000000006',
        email: 'chef-famille@eglise.org',
        statut: 'actif',
        mfaActive: false,
        dateCreation: '2026-04-01T08:00:00Z',
      },
      personne: {
        idPersonne: 'b2d4f6a8-0004-4000-8000-000000000006',
        nom: 'NGOY',
        prenom: 'Ruth',
        sexe: 'F',
        telephone: '+243810000006',
        statut: 'actif',
        dateCreation: '2026-04-08T08:00:00Z',
        dateModification: '2026-04-08T08:00:00Z',
      },
      roles: [chefFamilleRole],
      permissions: permissionCodesForRole(chefFamilleRole.idRole),
    },
  },
  {
    motDePasse: 'Superviseur2026!',
    utilisateur: {
      compte: {
        idCompte: 'a1c3e5f7-0003-4000-8000-000000000008',
        idPersonne: 'b2d4f6a8-0004-4000-8000-00000000000a',
        email: 'superviseur@eglise.org',
        statut: 'actif',
        mfaActive: false,
        dateCreation: '2026-04-02T08:00:00Z',
      },
      personne: {
        idPersonne: 'b2d4f6a8-0004-4000-8000-00000000000a',
        nom: 'KASONGO',
        prenom: 'Daniel',
        sexe: 'M',
        telephone: '+243810000080',
        statut: 'actif',
        dateCreation: '2026-04-02T08:00:00Z',
        dateModification: '2026-04-02T08:00:00Z',
      },
      roles: [superviseurRole],
      permissions: permissionCodesForRole(superviseurRole.idRole),
    },
  },
  {
    motDePasse: 'Dge2026!',
    utilisateur: {
      compte: {
        idCompte: 'a1c3e5f7-0003-4000-8000-000000000009',
        idPersonne: 'b2d4f6a8-0004-4000-8000-00000000000b',
        email: 'dge@eglise.org',
        statut: 'actif',
        mfaActive: false,
        dateCreation: '2026-04-03T08:00:00Z',
      },
      personne: {
        idPersonne: 'b2d4f6a8-0004-4000-8000-00000000000b',
        nom: 'LUMBU',
        prenom: 'Esther',
        sexe: 'F',
        telephone: '+243810000090',
        statut: 'actif',
        dateCreation: '2026-04-03T08:00:00Z',
        dateModification: '2026-04-03T08:00:00Z',
      },
      roles: [membreDgeRole],
      permissions: permissionCodesForRole(membreDgeRole.idRole),
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
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-00000000000a',
    nom: 'KASONGO',
    prenom: 'Daniel',
    sexe: 'M',
    telephone: '+243810000080',
    statut: 'actif',
    dateCreation: '2026-04-02T08:00:00Z',
    dateModification: '2026-04-02T08:00:00Z',
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-00000000000b',
    nom: 'LUMBU',
    prenom: 'Esther',
    sexe: 'F',
    telephone: '+243810000090',
    statut: 'actif',
    dateCreation: '2026-04-03T08:00:00Z',
    dateModification: '2026-04-03T08:00:00Z',
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
  {
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000006',
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000007',
    email: 'chef-louange@eglise.org',
    statut: 'actif',
    mfaActive: false,
    dateCreation: '2026-04-01T08:00:00Z',
  },
  {
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000007',
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000006',
    email: 'chef-famille@eglise.org',
    statut: 'actif',
    mfaActive: false,
    dateCreation: '2026-04-01T08:00:00Z',
  },
  {
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000008',
    idPersonne: 'b2d4f6a8-0004-4000-8000-00000000000a',
    email: 'superviseur@eglise.org',
    statut: 'actif',
    mfaActive: false,
    dateCreation: '2026-04-02T08:00:00Z',
  },
  {
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000009',
    idPersonne: 'b2d4f6a8-0004-4000-8000-00000000000b',
    email: 'dge@eglise.org',
    statut: 'actif',
    mfaActive: false,
    dateCreation: '2026-04-03T08:00:00Z',
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
  {
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000006',
    idRole: chefDepartementRole.idRole,
    dateDebut: '2026-04-01T08:00:00Z',
    actif: true,
  },
  {
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000007',
    idRole: chefFamilleRole.idRole,
    dateDebut: '2026-04-01T08:00:00Z',
    actif: true,
  },
  {
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000008',
    idRole: superviseurRole.idRole,
    dateDebut: '2026-04-02T08:00:00Z',
    actif: true,
  },
  {
    idCompte: 'a1c3e5f7-0003-4000-8000-000000000009',
    idRole: membreDgeRole.idRole,
    dateDebut: '2026-04-03T08:00:00Z',
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
    fonction: 'Chef',
    dateDebut: '2026-09-10T08:00:00Z',
    actif: true,
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-00000000000a',
    idDepartement: 'd4f6b8c0-0006-4000-8000-000000000001',
    fonction: 'Superviseur',
    dateDebut: '2026-04-02T08:00:00Z',
    actif: true,
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-00000000000a',
    idDepartement: 'd4f6b8c0-0006-4000-8000-000000000002',
    fonction: 'Superviseur',
    dateDebut: '2026-04-02T08:00:00Z',
    actif: true,
  },
]

export const seedFamilles: FamilleImpact[] = [
  {
    idFamille: 'f1a2b3c4-0008-4000-8000-000000000001',
    code: 'BATISSEURS',
    nom: 'Bâtisseurs',
    zone: 'Nord',
    description: 'Bâtir des relations durables dans le quartier Nord.',
    actif: true,
    dateCreation: '2026-01-20T08:00:00Z',
  },
  {
    idFamille: 'f1a2b3c4-0008-4000-8000-000000000002',
    code: 'LUMIERES',
    nom: 'Lumières',
    zone: 'Sud',
    description: 'Rayonner la lumière de Christ au Sud.',
    actif: true,
    dateCreation: '2026-02-03T08:00:00Z',
  },
  {
    idFamille: 'f1a2b3c4-0008-4000-8000-000000000003',
    code: 'GRACE',
    nom: 'Grâce',
    zone: 'Est',
    description: "Vivre et partager la grâce de Dieu à l'Est.",
    actif: true,
    dateCreation: '2026-02-10T08:00:00Z',
  },
  {
    idFamille: 'f1a2b3c4-0008-4000-8000-000000000004',
    code: 'SEMEURS',
    nom: 'Semeurs',
    zone: 'Ouest',
    actif: false,
    dateCreation: '2026-05-15T08:00:00Z',
  },
]

const BATISSEURS = 'f1a2b3c4-0008-4000-8000-000000000001'
const LUMIERES = 'f1a2b3c4-0008-4000-8000-000000000002'
const GRACE = 'f1a2b3c4-0008-4000-8000-000000000003'

export const seedAffectationsFamille: AffectationFamille[] = [
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000001',
    idFamille: BATISSEURS,
    fonction: 'Membre',
    dateDebut: '2026-01-20T08:00:00Z',
    actif: true,
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000002',
    idFamille: LUMIERES,
    fonction: 'Membre',
    dateDebut: '2026-02-18T09:30:00Z',
    actif: true,
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000003',
    idFamille: GRACE,
    fonction: 'Chef',
    dateDebut: '2026-03-01T08:00:00Z',
    actif: true,
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000004',
    idFamille: LUMIERES,
    fonction: 'Membre',
    dateDebut: '2026-02-05T08:00:00Z',
    actif: true,
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000006',
    idFamille: BATISSEURS,
    fonction: 'Chef',
    dateDebut: '2026-04-08T08:00:00Z',
    actif: true,
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000007',
    idFamille: BATISSEURS,
    fonction: 'Membre',
    dateDebut: '2026-09-10T08:00:00Z',
    actif: true,
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000008',
    idFamille: BATISSEURS,
    fonction: 'Membre',
    dateDebut: '2026-09-12T08:00:00Z',
    actif: true,
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000009',
    idFamille: GRACE,
    fonction: 'Membre',
    dateDebut: '2026-09-15T08:00:00Z',
    actif: true,
  },
  {
    idPersonne: 'b2d4f6a8-0004-4000-8000-000000000005',
    idFamille: GRACE,
    fonction: 'Membre',
    dateDebut: '2025-10-01T08:00:00Z',
    dateFin: '2026-01-20T08:00:00Z',
    actif: false,
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
