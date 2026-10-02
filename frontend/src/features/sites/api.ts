import { api } from '@/lib/apiClient'
import type { Site, SiteCreate, SitePage, SiteUpdate } from '@/types'

export type ListSitesParams = {
  page?: number
  limit?: number
  q?: string
}

export async function listSites(params: ListSitesParams = {}): Promise<SitePage> {
  const { data } = await api.get<SitePage>('/sites', { params })
  return data
}

export async function getSite(siteId: string): Promise<Site> {
  const { data } = await api.get<Site>(`/sites/${siteId}`)
  return data
}

export async function createSite(payload: SiteCreate): Promise<Site> {
  const { data } = await api.post<Site>('/sites', payload)
  return data
}

export async function updateSite(siteId: string, payload: SiteUpdate): Promise<Site> {
  const { data } = await api.patch<Site>(`/sites/${siteId}`, payload)
  return data
}

export async function deleteSite(siteId: string): Promise<void> {
  await api.delete(`/sites/${siteId}`)
}
