import { api } from '@/lib/apiClient'
import { createSite, listSites } from '@/features/sites/api'
import type { Departement, DepartementCreate, DepartementPage, DepartementUpdate } from '@/types'

/** Le contrat exige un site, mais le formulaire de département n'en demande plus. */
export async function defaultSiteId() {
  const page = await listSites({ page: 1, limit: 100 })
  const existant = page.data.find((site) => site.actif)?.idSite ?? page.data[0]?.idSite
  if (existant) return existant

  const cree = await createSite({
    code: 'ICC',
    nom: 'Impact Centre Chrétien',
    ville: 'Kinshasa',
    pays: 'RDC',
    telephone: '+243000000000',
    actif: true,
  })
  return cree.idSite
}

export type ListDepartementsParams = {
  page?: number
  limit?: number
  q?: string
  siteId?: string
}

export async function listDepartements(
  params: ListDepartementsParams = {},
): Promise<DepartementPage> {
  const { data } = await api.get<DepartementPage>('/departements', { params })
  return data
}

export async function getDepartement(departementId: string): Promise<Departement> {
  const { data } = await api.get<Departement>(`/departements/${departementId}`)
  return data
}

export async function createDepartement(payload: DepartementCreate): Promise<Departement> {
  const { data } = await api.post<Departement>('/departements', payload)
  return data
}

export async function updateDepartement(
  departementId: string,
  payload: DepartementUpdate,
): Promise<Departement> {
  const { data } = await api.patch<Departement>(`/departements/${departementId}`, payload)
  return data
}

export async function deleteDepartement(departementId: string): Promise<void> {
  await api.delete(`/departements/${departementId}`)
}
