import { api } from '@/lib/apiClient'
import type {
  AffectationRole,
  AffectationRoleCreate,
  Compte,
  CompteCreate,
  ComptePage,
  CompteStatut,
  CompteUpdate,
} from '@/types'

export type ListComptesParams = {
  page?: number
  limit?: number
  q?: string
  statut?: CompteStatut
}

export async function listComptes(params: ListComptesParams = {}): Promise<ComptePage> {
  const { data } = await api.get<ComptePage>('/comptes', { params })
  return data
}

export async function getCompte(compteId: string): Promise<Compte> {
  const { data } = await api.get<Compte>(`/comptes/${compteId}`)
  return data
}

export async function createCompte(payload: CompteCreate): Promise<Compte> {
  const { data } = await api.post<Compte>('/comptes', payload)
  return data
}

export async function updateCompte(compteId: string, payload: CompteUpdate): Promise<Compte> {
  const { data } = await api.patch<Compte>(`/comptes/${compteId}`, payload)
  return data
}

export async function deleteCompte(compteId: string): Promise<void> {
  await api.delete(`/comptes/${compteId}`)
}

export async function listCompteRoles(compteId: string): Promise<AffectationRole[]> {
  const { data } = await api.get<AffectationRole[]>(`/comptes/${compteId}/roles`)
  return data
}

export async function assignRoleToCompte(
  compteId: string,
  payload: AffectationRoleCreate,
): Promise<AffectationRole> {
  const { data } = await api.post<AffectationRole>(`/comptes/${compteId}/roles`, payload)
  return data
}

export async function unassignRoleFromCompte(compteId: string, roleId: string): Promise<void> {
  await api.delete(`/comptes/${compteId}/roles/${roleId}`)
}

/** Ouvre le compte puis pose les rôles d’accès (contrat : deux appels). */
export async function createCompteWithRoles(
  payload: CompteCreate,
  idRoles: string[],
): Promise<Compte> {
  const created = await createCompte(payload)
  for (const idRole of idRoles) {
    await assignRoleToCompte(created.idCompte, { idRole })
  }
  return created
}

/** Aligne les rôles actifs du compte sur la sélection du formulaire. */
export async function syncCompteRoles(compteId: string, idRoles: string[]): Promise<void> {
  const actuel = (await listCompteRoles(compteId)).filter((affectation) => affectation.actif)
  const actuelIds = new Set(actuel.map((affectation) => affectation.idRole))
  const suivant = new Set(idRoles)

  for (const idRole of suivant) {
    if (!actuelIds.has(idRole)) await assignRoleToCompte(compteId, { idRole })
  }
  for (const idRole of actuelIds) {
    if (!suivant.has(idRole)) await unassignRoleFromCompte(compteId, idRole)
  }
}
