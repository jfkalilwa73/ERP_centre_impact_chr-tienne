import { PERMISSIONS } from '@/lib/permissions'
import { ROLE_CODES } from '@/lib/roleCodes'
import type { Permission, Role } from '@/types'

function permission(id: string, code: string, description: string): Permission {
  const [module = '', action = ''] = code.split('.')
  return {
    idPermission: `6f1a2c10-0001-4000-8000-${id}`,
    code,
    module,
    action,
    description,
    actif: true,
  }
}

function role(
  id: string,
  code: string,
  nom: string,
  description: string,
  niveauConfidentialite: number,
  dateCreation: string,
): Role {
  return {
    idRole: `2b9d4f60-0002-4000-8000-${id}`,
    code,
    nom,
    description,
    niveauConfidentialite,
    actif: true,
    dateCreation,
  }
}

export const seedPermissions: Permission[] = [
  permission('000000000001', PERMISSIONS.MEMBRES_READ, 'Consulter les personnes'),
  permission('000000000002', PERMISSIONS.MEMBRES_CREATE, 'Créer une personne'),
  permission('00000000000e', PERMISSIONS.MEMBRES_UPDATE, 'Modifier une personne'),
  permission('00000000000f', PERMISSIONS.MEMBRES_DELETE, 'Supprimer une personne inactive'),
  permission('000000000006', PERMISSIONS.COMPTES_READ, 'Consulter les comptes'),
  permission('000000000010', PERMISSIONS.COMPTES_CREATE, 'Créer un compte'),
  permission('000000000011', PERMISSIONS.COMPTES_UPDATE, 'Modifier un compte'),
  permission('000000000012', PERMISSIONS.COMPTES_DELETE, 'Supprimer un compte non actif'),
  permission('000000000003', PERMISSIONS.SITES_READ, 'Consulter les sites'),
  permission('000000000007', PERMISSIONS.SITES_CREATE, 'Créer un site'),
  permission('000000000008', PERMISSIONS.SITES_UPDATE, 'Modifier un site'),
  permission('000000000009', PERMISSIONS.SITES_DELETE, 'Supprimer un site non utilisé'),
  permission('00000000000a', PERMISSIONS.DEPARTEMENTS_READ, 'Consulter les départements'),
  permission('00000000000b', PERMISSIONS.DEPARTEMENTS_CREATE, 'Créer un département'),
  permission('00000000000c', PERMISSIONS.DEPARTEMENTS_UPDATE, 'Modifier un département'),
  permission('00000000000d', PERMISSIONS.DEPARTEMENTS_DELETE, 'Supprimer un département non utilisé'),
  permission('000000000013', PERMISSIONS.FAMILLES_READ, "Consulter les familles d'impact"),
  permission('000000000014', PERMISSIONS.FAMILLES_CREATE, "Créer une famille d'impact"),
  permission('000000000015', PERMISSIONS.FAMILLES_UPDATE, "Modifier une famille d'impact"),
  permission('000000000016', PERMISSIONS.FAMILLES_DELETE, "Supprimer une famille d'impact sans membre"),
  permission('000000000017', PERMISSIONS.ROLES_READ, 'Consulter les rôles et les permissions'),
  permission('000000000004', PERMISSIONS.ROLES_MANAGE, 'Administrer les rôles et les permissions'),
  permission('000000000005', PERMISSIONS.AUDIT_READ, "Consulter les traces d'audit"),
  permission('000000000018', PERMISSIONS.SYSTEME_MANAGE, 'Configuration technique, sessions et MFA'),
  permission('000000000019', PERMISSIONS.PASTORALE_READ, 'Consulter les dossiers pastoraux habilités'),
  permission('00000000001a', PERMISSIONS.PASTORALE_CREATE, 'Créer un suivi pastoral'),
  permission('00000000001b', PERMISSIONS.PASTORALE_NOTES, 'Lire et écrire les notes pastorales confidentielles'),
  permission('00000000001c', PERMISSIONS.PASTORALE_RDV, 'Gérer les rendez-vous pastoraux'),
  permission('00000000001d', PERMISSIONS.ACTIVITES_READ, 'Consulter les activités'),
  permission('00000000001e', PERMISSIONS.ACTIVITES_CREATE, 'Créer une activité'),
  permission('00000000001f', PERMISSIONS.ACTIVITES_UPDATE, 'Modifier une activité'),
  permission('000000000020', PERMISSIONS.BUDGET_READ, 'Consulter un budget'),
  permission('000000000021', PERMISSIONS.BUDGET_REQUEST, 'Demander une dépense'),
  permission('000000000022', PERMISSIONS.RAPPORTS_READ, 'Consulter les rapports'),
  permission('000000000023', PERMISSIONS.RAPPORTS_CREATE, 'Produire un rapport'),
  permission('000000000024', PERMISSIONS.FINANCE_READ, 'Consulter les informations financières'),
  permission('000000000025', PERMISSIONS.FINANCE_MANAGE, 'Comptabiliser et valider les opérations financières'),
  permission('000000000026', PERMISSIONS.CAISSE_READ, "Consulter l'état de caisse"),
  permission('000000000027', PERMISSIONS.CAISSE_MANAGE, 'Ouvrir, clôturer et mouvementer une caisse'),
  permission('000000000028', PERMISSIONS.RH_READ, 'Consulter les dossiers RH autorisés'),
  permission('000000000029', PERMISSIONS.RH_MANAGE, 'Gérer le personnel, les contrats et les absences'),
  permission('00000000002a', PERMISSIONS.RH_SALAIRES, 'Consulter les informations salariales'),
  permission('00000000002b', PERMISSIONS.ACHATS_READ, 'Consulter les achats et fournisseurs'),
  permission('00000000002c', PERMISSIONS.ACHATS_MANAGE, 'Piloter le processus d’achat'),
  permission('00000000002d', PERMISSIONS.LOGISTIQUE_READ, 'Consulter le patrimoine et les stocks'),
  permission('00000000002e', PERMISSIONS.LOGISTIQUE_MANAGE, 'Gérer patrimoine, stocks et maintenance'),
  permission('00000000002f', PERMISSIONS.PROJETS_READ, 'Consulter les projets'),
  permission('000000000030', PERMISSIONS.PROJETS_MANAGE, 'Piloter le portefeuille de projets'),
  permission('000000000031', PERMISSIONS.PROTOCOLE_READ, 'Consulter le calendrier pastoral administratif'),
  permission('000000000032', PERMISSIONS.PROTOCOLE_MANAGE, 'Qualifier et planifier les rendez-vous pastoraux'),
  permission('000000000033', PERMISSIONS.SECRETARIAT_READ, 'Consulter courriers et réunions'),
  permission('000000000034', PERMISSIONS.SECRETARIAT_MANAGE, 'Gérer courriers, convocations et comptes rendus'),
  permission('000000000035', PERMISSIONS.ARCHIVES_READ, 'Rechercher des documents classés'),
  permission('000000000036', PERMISSIONS.ARCHIVES_MANAGE, 'Classer, indexer et archiver'),
  permission('000000000037', PERMISSIONS.TECHNIQUE_READ, 'Consulter les interventions techniques'),
  permission('000000000038', PERMISSIONS.TECHNIQUE_MANAGE, 'Clôturer les interventions assignées'),
  permission('000000000039', PERMISSIONS.EQUIPES_READ, 'Consulter les équipes des unités affectées'),
  permission('00000000003a', PERMISSIONS.EQUIPES_MANAGE, 'Affecter, responsabilités, disponibilités et bénévoles'),
  permission('00000000003b', PERMISSIONS.OBJECTIFS_READ, 'Consulter les objectifs d’une unité'),
  permission('00000000003c', PERMISSIONS.OBJECTIFS_MANAGE, 'Suivre les objectifs, écarts et plans d’action'),
  permission('00000000003d', PERMISSIONS.DEMANDES_READ, 'Suivre les demandes d’une unité'),
  permission('00000000003e', PERMISSIONS.DEMANDES_CREATE, 'Créer une demande pour son unité'),
  permission('00000000003f', PERMISSIONS.ALERTES_READ, 'Suivre les alertes des unités supervisées'),
  permission('000000000040', PERMISSIONS.PERFORMANCES_READ, 'Suivre les performances des unités supervisées'),
  permission('000000000041', PERMISSIONS.RAPPORTS_CONSOLIDATE, 'Contrôler et consolider les rapports des chefs'),
]

export const adminRole = role(
  '000000000001',
  ROLE_CODES.ADMIN_FONCTIONNEL,
  'Administrateur fonctionnel',
  'Configure le fonctionnement métier de l’ERP, sans droit technique ni notes pastorales.',
  3,
  '2026-01-05T08:00:00Z',
)

export const accueilRole = role(
  '000000000002',
  ROLE_CODES.RESPONSABLE_ACCUEIL,
  'Responsable accueil',
  'Fonction départementale : consultation des membres du site d’affectation.',
  1,
  '2026-01-05T08:00:00Z',
)

export const pasteurRole = role(
  '000000000003',
  ROLE_CODES.PASTEUR,
  'Pasteur',
  'Accompagnement pastoral. Pas d’administration de l’Église, ni lecture des comptes ou des rôles.',
  2,
  '2026-03-01T08:00:00Z',
)

export const chefDepartementRole = role(
  '000000000004',
  ROLE_CODES.CHEF_DEPARTEMENT,
  'Chef de département',
  'Pilote son département : équipe, activités, demandes, objectifs, budget, projets et rapports.',
  1,
  '2026-04-01T08:00:00Z',
)

export const chefFamilleRole = role(
  '000000000005',
  ROLE_CODES.CHEF_FAMILLE,
  "Chef de famille d'impact",
  "Tableau de bord de sa famille d'impact uniquement.",
  1,
  '2026-04-01T08:00:00Z',
)

export const adminTechniqueRole = role(
  '000000000006',
  ROLE_CODES.ADMIN_TECHNIQUE,
  'Administrateur technique',
  'Comptes, sessions, MFA et journaux techniques. Aucun droit métier confidentiel.',
  3,
  '2026-01-06T08:00:00Z',
)

export const conseilPastoralRole = role(
  '000000000007',
  ROLE_CODES.CONSEIL_PASTORAL,
  'Membre du Conseil pastoral',
  'Réunions, décisions et documents du Conseil. Confidentialité renforcée.',
  3,
  '2026-03-02T08:00:00Z',
)

export const membreDgeRole = role(
  '000000000008',
  ROLE_CODES.MEMBRE_DGE,
  'Membre DGE',
  'Vue consolidée de l’organisation. Pas d’accès aux secrets pastoraux.',
  2,
  '2026-03-03T08:00:00Z',
)

export const superviseurRole = role(
  '000000000009',
  ROLE_CODES.SUPERVISEUR,
  'Superviseur',
  'Au-dessus des chefs : ne voit que les départements qui lui sont affectés, sauf permission explicite supplémentaire.',
  2,
  '2026-04-02T08:00:00Z',
)

export const responsableProjetsRole = role(
  '00000000000a',
  ROLE_CODES.RESPONSABLE_PROJETS,
  'Responsable Projets',
  'Portefeuille, jalons, risques et clôture des projets.',
  2,
  '2026-04-03T08:00:00Z',
)

export const financeRole = role(
  '00000000000b',
  ROLE_CODES.FINANCE_COMPTABLE,
  'Finance / Comptable',
  'Comptabilité et finances. Séparé du caissier et du demandeur.',
  3,
  '2026-04-04T08:00:00Z',
)

export const caissierRole = role(
  '00000000000c',
  ROLE_CODES.CAISSIER,
  'Caissier',
  'Caisse et mouvements autorisés, sans toute la comptabilité.',
  2,
  '2026-04-05T08:00:00Z',
)

export const rhRole = role(
  '00000000000d',
  ROLE_CODES.RH,
  'RH',
  'Personnel, bénévoles et contrats. Les salaires restent une permission distincte.',
  3,
  '2026-04-06T08:00:00Z',
)

export const achatsRole = role(
  '00000000000e',
  ROLE_CODES.ACHATS,
  'Achats',
  'Demandes, fournisseurs, commandes et rapprochements.',
  2,
  '2026-04-07T08:00:00Z',
)

export const logistiqueRole = role(
  '00000000000f',
  ROLE_CODES.LOGISTIQUE,
  'Logistique',
  'Patrimoine, stocks, maintenance et incidents.',
  2,
  '2026-04-08T08:00:00Z',
)

export const protocoleRole = role(
  '000000000010',
  ROLE_CODES.PROTOCOLE_PASTEUR,
  'Protocole du Pasteur',
  'File d’attente et calendrier pastoral. Jamais les notes confidentielles.',
  2,
  '2026-04-09T08:00:00Z',
)

export const auditRole = role(
  '000000000011',
  ROLE_CODES.AUDIT_COMPLIANCE,
  'Audit & Compliance',
  'Contrôle indépendant. Lecture des traces, sans exécuter les processus contrôlés.',
  3,
  '2026-04-10T08:00:00Z',
)

export const secretariatRole = role(
  '000000000012',
  ROLE_CODES.SECRETARIAT,
  'Secrétariat',
  'Courriers, réunions, convocations et comptes rendus.',
  1,
  '2026-04-11T08:00:00Z',
)

export const archivisteRole = role(
  '000000000013',
  ROLE_CODES.ARCHIVISTE,
  'Archiviste',
  'GED et archives. Pas de lecture automatique de tous les documents confidentiels.',
  2,
  '2026-04-12T08:00:00Z',
)

export const technicienRole = role(
  '000000000014',
  ROLE_CODES.TECHNICIEN,
  'Technicien',
  'Interventions sur équipements, incidents et maintenance assignée.',
  1,
  '2026-04-13T08:00:00Z',
)

export const benevoleRole = role(
  '000000000015',
  ROLE_CODES.BENEVOLE,
  'Bénévole',
  'Affectations, planning et tâches de son équipe. Pas de budget ni de secrets.',
  1,
  '2026-04-14T08:00:00Z',
)

export const membreRole = role(
  '000000000016',
  ROLE_CODES.MEMBRE,
  'Membre',
  'Portail personnel : profil, famille, inscriptions et demandes autorisées.',
  1,
  '2026-04-15T08:00:00Z',
)

export const seedRoles: Role[] = [
  adminRole,
  adminTechniqueRole,
  pasteurRole,
  conseilPastoralRole,
  membreDgeRole,
  superviseurRole,
  chefDepartementRole,
  responsableProjetsRole,
  financeRole,
  caissierRole,
  rhRole,
  achatsRole,
  logistiqueRole,
  protocoleRole,
  auditRole,
  secretariatRole,
  archivisteRole,
  technicienRole,
  benevoleRole,
  membreRole,
  accueilRole,
  chefFamilleRole,
]

export type RolePermissionLink = {
  idRole: string
  idPermission: string
}

function permissionLinks(target: Role, codes: string[]): RolePermissionLink[] {
  return seedPermissions
    .filter((item) => codes.includes(item.code))
    .map((item) => ({ idRole: target.idRole, idPermission: item.idPermission }))
}

const adminFonctionnelCodes = seedPermissions
  .filter(
    (item) =>
      item.code !== PERMISSIONS.SYSTEME_MANAGE &&
      item.code !== PERMISSIONS.PASTORALE_NOTES &&
      item.code !== PERMISSIONS.RH_SALAIRES,
  )
  .map((item) => item.code)

export const seedRolePermissions: RolePermissionLink[] = [
  ...permissionLinks(adminRole, adminFonctionnelCodes),
  ...permissionLinks(adminTechniqueRole, [
    PERMISSIONS.SYSTEME_MANAGE,
    PERMISSIONS.COMPTES_READ,
    PERMISSIONS.COMPTES_CREATE,
    PERMISSIONS.COMPTES_UPDATE,
    PERMISSIONS.COMPTES_DELETE,
    PERMISSIONS.AUDIT_READ,
  ]),
  ...permissionLinks(pasteurRole, [
    PERMISSIONS.MEMBRES_READ,
    PERMISSIONS.MEMBRES_CREATE,
    PERMISSIONS.MEMBRES_UPDATE,
    PERMISSIONS.SITES_READ,
    PERMISSIONS.FAMILLES_READ,
    PERMISSIONS.PASTORALE_READ,
    PERMISSIONS.PASTORALE_CREATE,
    PERMISSIONS.PASTORALE_NOTES,
    PERMISSIONS.PASTORALE_RDV,
    PERMISSIONS.ACTIVITES_READ,
    PERMISSIONS.DEPARTEMENTS_READ,
    PERMISSIONS.EQUIPES_READ,
    PERMISSIONS.OBJECTIFS_READ,
    PERMISSIONS.BUDGET_READ,
    PERMISSIONS.RAPPORTS_READ,
    PERMISSIONS.DEMANDES_READ,
    PERMISSIONS.ALERTES_READ,
    PERMISSIONS.PERFORMANCES_READ,
  ]),
  ...permissionLinks(conseilPastoralRole, [
    PERMISSIONS.MEMBRES_READ,
    PERMISSIONS.PASTORALE_READ,
    PERMISSIONS.SECRETARIAT_READ,
    PERMISSIONS.ARCHIVES_READ,
  ]),
  ...permissionLinks(membreDgeRole, [
    PERMISSIONS.MEMBRES_READ,
    PERMISSIONS.MEMBRES_UPDATE,
    PERMISSIONS.COMPTES_READ,
    PERMISSIONS.SITES_READ,
    PERMISSIONS.DEPARTEMENTS_READ,
    PERMISSIONS.FAMILLES_READ,
    PERMISSIONS.ACTIVITES_READ,
    PERMISSIONS.PROJETS_READ,
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.RAPPORTS_READ,
    PERMISSIONS.DEMANDES_READ,
    PERMISSIONS.DEMANDES_CREATE,
  ]),
  ...permissionLinks(superviseurRole, [
    PERMISSIONS.DEPARTEMENTS_READ,
    PERMISSIONS.EQUIPES_READ,
    PERMISSIONS.ACTIVITES_READ,
    PERMISSIONS.OBJECTIFS_READ,
    PERMISSIONS.BUDGET_READ,
    PERMISSIONS.PROJETS_READ,
    PERMISSIONS.RAPPORTS_READ,
    PERMISSIONS.RAPPORTS_CONSOLIDATE,
    PERMISSIONS.PERFORMANCES_READ,
    PERMISSIONS.DEMANDES_READ,
    PERMISSIONS.ALERTES_READ,
  ]),
  ...permissionLinks(chefDepartementRole, [
    PERMISSIONS.EQUIPES_READ,
    PERMISSIONS.EQUIPES_MANAGE,
    PERMISSIONS.ACTIVITES_READ,
    PERMISSIONS.ACTIVITES_CREATE,
    PERMISSIONS.ACTIVITES_UPDATE,
    PERMISSIONS.OBJECTIFS_READ,
    PERMISSIONS.OBJECTIFS_MANAGE,
    PERMISSIONS.BUDGET_READ,
    PERMISSIONS.BUDGET_REQUEST,
    PERMISSIONS.PROJETS_READ,
    PERMISSIONS.RAPPORTS_READ,
    PERMISSIONS.RAPPORTS_CREATE,
    PERMISSIONS.DEMANDES_READ,
    PERMISSIONS.DEMANDES_CREATE,
  ]),
  ...permissionLinks(responsableProjetsRole, [
    PERMISSIONS.PROJETS_READ,
    PERMISSIONS.PROJETS_MANAGE,
    PERMISSIONS.BUDGET_READ,
    PERMISSIONS.RAPPORTS_READ,
    PERMISSIONS.RAPPORTS_CREATE,
  ]),
  ...permissionLinks(financeRole, [
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.FINANCE_MANAGE,
    PERMISSIONS.BUDGET_READ,
    PERMISSIONS.CAISSE_READ,
  ]),
  ...permissionLinks(caissierRole, [PERMISSIONS.CAISSE_READ, PERMISSIONS.CAISSE_MANAGE]),
  ...permissionLinks(rhRole, [PERMISSIONS.RH_READ, PERMISSIONS.RH_MANAGE, PERMISSIONS.MEMBRES_READ]),
  ...permissionLinks(achatsRole, [PERMISSIONS.ACHATS_READ, PERMISSIONS.ACHATS_MANAGE]),
  ...permissionLinks(logistiqueRole, [PERMISSIONS.LOGISTIQUE_READ, PERMISSIONS.LOGISTIQUE_MANAGE]),
  ...permissionLinks(protocoleRole, [
    PERMISSIONS.MEMBRES_READ,
    PERMISSIONS.PROTOCOLE_READ,
    PERMISSIONS.PROTOCOLE_MANAGE,
    PERMISSIONS.PASTORALE_RDV,
  ]),
  ...permissionLinks(auditRole, [PERMISSIONS.AUDIT_READ, PERMISSIONS.RAPPORTS_READ]),
  ...permissionLinks(secretariatRole, [
    PERMISSIONS.MEMBRES_READ,
    PERMISSIONS.SITES_READ,
    PERMISSIONS.SECRETARIAT_READ,
    PERMISSIONS.SECRETARIAT_MANAGE,
  ]),
  ...permissionLinks(archivisteRole, [PERMISSIONS.ARCHIVES_READ, PERMISSIONS.ARCHIVES_MANAGE]),
  ...permissionLinks(technicienRole, [PERMISSIONS.TECHNIQUE_READ, PERMISSIONS.TECHNIQUE_MANAGE]),
  ...permissionLinks(benevoleRole, [PERMISSIONS.ACTIVITES_READ]),
  ...permissionLinks(accueilRole, [
    PERMISSIONS.MEMBRES_READ,
    PERMISSIONS.SITES_READ,
    PERMISSIONS.DEPARTEMENTS_READ,
    PERMISSIONS.FAMILLES_READ,
  ]),
  ...permissionLinks(chefFamilleRole, [
    PERMISSIONS.ACTIVITES_READ,
    PERMISSIONS.ACTIVITES_UPDATE,
  ]),
]

export function permissionCodesForRole(idRole: string): string[] {
  return seedRolePermissions
    .filter((link) => link.idRole === idRole)
    .map((link) => seedPermissions.find((item) => item.idPermission === link.idPermission)?.code)
    .filter((code): code is string => Boolean(code))
}

export const pasteurPermissionCodes = permissionCodesForRole(pasteurRole.idRole)
export const adminFonctionnelPermissionCodes = adminFonctionnelCodes
