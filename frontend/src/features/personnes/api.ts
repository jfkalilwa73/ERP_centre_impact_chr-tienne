import { api } from '@/lib/apiClient'
import type {
  AffectationDepartement,
  AffectationDepartementCreate,
  Personne,
  PersonneCreate,
  PersonnePage,
  PersonneStatut,
  PersonneUpdate,
} from '@/types'

export type ListPersonnesParams = {
  page?: number
  limit?: number
  q?: string
  statut?: PersonneStatut
}

export async function listPersonnes(params: ListPersonnesParams = {}): Promise<PersonnePage> {
  const { data } = await api.get<PersonnePage>('/personnes', { params })
  return data
}

export async function getPersonne(personneId: string): Promise<Personne> {
  const { data } = await api.get<Personne>(`/personnes/${personneId}`)
  return data
}

export async function createPersonne(payload: PersonneCreate): Promise<Personne> {
  const { data } = await api.post<Personne>('/personnes', payload)
  return data
}

export async function updatePersonne(personneId: string, payload: PersonneUpdate): Promise<Personne> {
  const { data } = await api.patch<Personne>(`/personnes/${personneId}`, payload)
  return data
}

export async function deletePersonne(personneId: string): Promise<void> {
  await api.delete(`/personnes/${personneId}`)
}

export async function listPersonneDepartements(
  personneId: string,
  actif?: boolean,
): Promise<AffectationDepartement[]> {
  const { data } = await api.get<AffectationDepartement[]>(`/personnes/${personneId}/departements`, {
    params: actif === undefined ? undefined : { actif },
  })
  return data
}

export async function assignPersonneDepartement(
  personneId: string,
  payload: AffectationDepartementCreate,
): Promise<AffectationDepartement> {
  const { data } = await api.post<AffectationDepartement>(
    `/personnes/${personneId}/departements`,
    payload,
  )
  return data
}

export async function unassignPersonneDepartement(
  personneId: string,
  departementId: string,
): Promise<void> {
  await api.delete(`/personnes/${personneId}/departements/${departementId}`)
}
