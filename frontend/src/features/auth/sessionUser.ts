import type { Compte, CurrentUser, Personne, Role } from '@/types'

export type SessionPayload = {
  id?: number
  name?: string
  email?: string
  statut?: string
  permissions?: string[]
  compte?: Partial<Compte> | null
  personne?: Partial<Personne> | null
  roles?: unknown
}

function compteStatut(value: string | undefined): Compte['statut'] {
  if (value === 'suspendu' || value === 'desactive' || value === 'actif') return value
  return 'actif'
}

function personneStatut(value: string | undefined): NonNullable<Personne['statut']> {
  if (value === 'inactif' || value === 'archive' || value === 'actif') return value
  return 'actif'
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/)
  return { prenom: parts[0] ?? '', nom: parts.slice(1).join(' ') }
}

function normalizePersonne(session: SessionPayload): Personne {
  const fallback = splitName(session.name ?? session.email ?? '')
  const source = session.personne ?? {}
  const now = new Date().toISOString()
  return {
    nom: source.nom || fallback.nom,
    prenom: source.prenom || fallback.prenom,
    idPersonne: source.idPersonne ?? '',
    statut: personneStatut(source.statut),
    dateNaissance: source.dateNaissance,
    sexe: source.sexe,
    telephone: source.telephone,
    adresse: source.adresse,
    photoUrl: source.photoUrl,
    dateCreation: source.dateCreation ?? now,
    dateModification: source.dateModification ?? source.dateCreation ?? now,
  }
}

function normalizeCompte(session: SessionPayload, idPersonne: string): Compte {
  const source = session.compte ?? {}
  return {
    idCompte: String(source.idCompte ?? session.id ?? ''),
    idPersonne: source.idPersonne || idPersonne,
    email: source.email || session.email || '',
    statut: compteStatut(source.statut || session.statut),
    derniereConnexion: source.derniereConnexion,
    mfaActive: Boolean(source.mfaActive),
    dateCreation: source.dateCreation ?? new Date().toISOString(),
    dateDesactivation: source.dateDesactivation,
  }
}

function normalizeRole(role: Partial<Role>): Role {
  return {
    code: role.code ?? 'ROLE',
    nom: role.nom ?? role.code ?? 'Rôle',
    idRole: role.idRole ?? '',
    dateCreation: role.dateCreation ?? new Date(0).toISOString(),
    description: role.description,
    niveauConfidentialite: role.niveauConfidentialite ?? 1,
    actif: role.actif ?? true,
  }
}

function normalizeRoles(value: unknown): Role[] {
  const list = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && 'data' in value && Array.isArray(value.data)
      ? value.data
      : []
  return list
    .filter((item): item is Partial<Role> => Boolean(item) && typeof item === 'object')
    .map((item) => normalizeRole(item))
}

export function currentUserFromSession(session: SessionPayload): CurrentUser {
  const personne = normalizePersonne(session)
  return {
    compte: normalizeCompte(session, personne.idPersonne),
    personne,
    roles: normalizeRoles(session.roles),
    permissions: Array.isArray(session.permissions) ? session.permissions : [],
  }
}
