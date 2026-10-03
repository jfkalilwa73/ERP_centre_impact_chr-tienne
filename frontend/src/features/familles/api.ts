import { api } from '@/lib/apiClient'
import type { FamilleImpact, FamilleImpactCreate, FamilleImpactPage, FamilleImpactUpdate } from '@/types'

export type ListFamillesParams = {
  page?: number
  limit?: number
  q?: string
}

export async function listFamilles(params: ListFamillesParams = {}): Promise<FamilleImpactPage> {
  const { data } = await api.get<FamilleImpactPage>('/familles-impact', { params })
  return data
}

export async function getFamille(familleId: string): Promise<FamilleImpact> {
  const { data } = await api.get<FamilleImpact>(`/familles-impact/${familleId}`)
  return data
}

export async function createFamille(payload: FamilleImpactCreate): Promise<FamilleImpact> {
  const { data } = await api.post<FamilleImpact>('/familles-impact', payload)
  return data
}

export async function updateFamille(
  familleId: string,
  payload: FamilleImpactUpdate,
): Promise<FamilleImpact> {
  const { data } = await api.patch<FamilleImpact>(`/familles-impact/${familleId}`, payload)
  return data
}

export async function deleteFamille(familleId: string): Promise<void> {
  await api.delete(`/familles-impact/${familleId}`)
}
