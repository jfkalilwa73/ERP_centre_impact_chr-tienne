export const actionLabels: Record<string, string> = {
  PERSONNE_CREATED: 'Personne créée',
  PERSONNE_UPDATED: 'Personne modifiée',
  PERSONNE_DELETED: 'Personne supprimée',
  COMPTE_CREATED: 'Compte créé',
  COMPTE_UPDATED: 'Compte modifié',
  COMPTE_DELETED: 'Compte supprimé',
  ROLE_CREATED: 'Rôle créé',
  ROLE_UPDATED: 'Rôle modifié',
  ROLE_DELETED: 'Rôle supprimé',
  ROLE_ASSIGNED: 'Rôle attribué',
  PERMISSION_CREATED: 'Permission créée',
  PERMISSION_UPDATED: 'Permission modifiée',
  PERMISSION_DELETED: 'Permission supprimée',
  PERMISSION_ASSIGNED: 'Permission attribuée',
  PERMISSION_UNASSIGNED: 'Permission retirée',
  SITE_CREATED: 'Site créé',
  SITE_UPDATED: 'Site modifié',
  SITE_DELETED: 'Site supprimé',
  DEPARTEMENT_CREATED: 'Département créé',
  DEPARTEMENT_UPDATED: 'Département modifié',
  DEPARTEMENT_DELETED: 'Département supprimé',
}

export const entiteTypeLabels: Record<string, string> = {
  personne: 'Personne',
  compte: 'Compte',
  role: 'Rôle',
  permission: 'Permission',
  site: 'Site',
  departement: 'Département',
  affectation_role: 'Affectation de rôle',
}

export function labelAction(action: string) {
  return actionLabels[action] ?? action
}

export function labelEntiteType(entiteType: string) {
  return entiteTypeLabels[entiteType] ?? entiteType
}
