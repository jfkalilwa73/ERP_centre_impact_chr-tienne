import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/lib/apiError'
import type { Site, SiteCreate, SiteUpdate } from '@/types'
import { createSite, deleteSite, listSites, updateSite, type ListSitesParams } from './api'

export const siteKeys = {
  all: ['sites'] as const,
  list: (params: ListSitesParams) => [...siteKeys.all, 'list', params] as const,
}

export function useSites(params: ListSitesParams) {
  return useQuery({
    queryKey: siteKeys.list(params),
    queryFn: () => listSites(params),
  })
}

export function useCreateSite() {
  const queryClient = useQueryClient()

  return useMutation<Site, ApiError, SiteCreate>({
    mutationFn: createSite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: siteKeys.all }),
  })
}

export function useUpdateSite() {
  const queryClient = useQueryClient()

  return useMutation<Site, ApiError, { siteId: string; payload: SiteUpdate }>({
    mutationFn: ({ siteId, payload }) => updateSite(siteId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: siteKeys.all }),
  })
}

export function useDeleteSite() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: deleteSite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: siteKeys.all }),
  })
}
