import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/lib/apiError'
import { departementKeys } from '@/features/departements/hooks'
import { familleKeys } from '@/features/familles/hooks'
import type {
  AffectationDepartement,
  AffectationDepartementCreate,
  AffectationFamille,
  AffectationFamilleCreate,
  Personne,
  PersonneCreate,
  PersonneUpdate,
} from '@/types'
import {
  assignPersonneDepartement,
  assignPersonneFamille,
  createPersonne,
  deletePersonne,
  getPersonne,
  listPersonneDepartements,
  listPersonneFamilles,
  listPersonnes,
  unassignPersonneDepartement,
  unassignPersonneFamille,
  updatePersonne,
  type ListPersonnesParams,
} from './api'

export const personneKeys = {
  all: ['personnes'] as const,
  list: (params: ListPersonnesParams) => [...personneKeys.all, 'list', params] as const,
  detail: (id: string) => [...personneKeys.all, 'detail', id] as const,
  affectations: (id: string) => [...personneKeys.all, 'affectations', id] as const,
  familles: (id: string) => [...personneKeys.all, 'familles', id] as const,
}

export function usePersonnes(params: ListPersonnesParams, enabled = true) {
  return useQuery({
    queryKey: personneKeys.list(params),
    queryFn: () => listPersonnes(params),
    enabled,
  })
}

export function usePersonne(personneId: string | undefined) {
  return useQuery({
    queryKey: personneKeys.detail(personneId ?? ''),
    queryFn: () => getPersonne(personneId!),
    enabled: Boolean(personneId),
  })
}

export function usePersonneAffectations(personneId: string | undefined) {
  return useQuery({
    queryKey: personneKeys.affectations(personneId ?? ''),
    queryFn: () => listPersonneDepartements(personneId!),
    enabled: Boolean(personneId),
  })
}

export function usePersonnesAffectations(personneIds: string[], actif = true) {
  return useQueries({
    queries: personneIds.map((personneId) => ({
      queryKey: [...personneKeys.affectations(personneId), actif ? 'actif' : 'all'],
      queryFn: () => listPersonneDepartements(personneId, actif === true ? true : undefined),
      enabled: Boolean(personneId),
    })),
  })
}

function invalidatePersonnes(queryClient: ReturnType<typeof useQueryClient>, personneId?: string) {
  void queryClient.invalidateQueries({ queryKey: personneKeys.all })
  if (personneId) {
    void queryClient.invalidateQueries({ queryKey: personneKeys.detail(personneId) })
    void queryClient.invalidateQueries({ queryKey: personneKeys.affectations(personneId) })
    void queryClient.invalidateQueries({ queryKey: personneKeys.familles(personneId) })
  }
}

export function useCreatePersonne() {
  const queryClient = useQueryClient()

  return useMutation<Personne, ApiError, PersonneCreate>({
    mutationFn: createPersonne,
    onSuccess: () => invalidatePersonnes(queryClient),
  })
}

export function useUpdatePersonne() {
  const queryClient = useQueryClient()

  return useMutation<Personne, ApiError, { personneId: string; payload: PersonneUpdate }>({
    mutationFn: ({ personneId, payload }) => updatePersonne(personneId, payload),
    onSuccess: (_data, variables) => invalidatePersonnes(queryClient, variables.personneId),
  })
}

export function useDeletePersonne() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: deletePersonne,
    onSuccess: () => invalidatePersonnes(queryClient),
  })
}

export function useAssignDepartement(personneId: string) {
  const queryClient = useQueryClient()

  return useMutation<AffectationDepartement, ApiError, AffectationDepartementCreate>({
    mutationFn: (payload) => assignPersonneDepartement(personneId, payload),
    onSuccess: () => {
      invalidatePersonnes(queryClient, personneId)
      void queryClient.invalidateQueries({ queryKey: departementKeys.all })
    },
  })
}

export function useUnassignDepartement(personneId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: (departementId) => unassignPersonneDepartement(personneId, departementId),
    onSuccess: () => {
      invalidatePersonnes(queryClient, personneId)
      void queryClient.invalidateQueries({ queryKey: departementKeys.all })
    },
  })
}

export function usePersonneFamilles(personneId: string | undefined) {
  return useQuery({
    queryKey: personneKeys.familles(personneId ?? ''),
    queryFn: () => listPersonneFamilles(personneId!),
    enabled: Boolean(personneId),
  })
}

export function usePersonnesFamilles(personneIds: string[], actif = true) {
  return useQueries({
    queries: personneIds.map((personneId) => ({
      queryKey: [...personneKeys.familles(personneId), actif ? 'actif' : 'all'],
      queryFn: () => listPersonneFamilles(personneId, actif === true ? true : undefined),
      enabled: Boolean(personneId),
    })),
  })
}

export function useAssignFamille(personneId: string) {
  const queryClient = useQueryClient()

  return useMutation<AffectationFamille, ApiError, AffectationFamilleCreate>({
    mutationFn: (payload) => assignPersonneFamille(personneId, payload),
    onSuccess: () => {
      invalidatePersonnes(queryClient, personneId)
      void queryClient.invalidateQueries({ queryKey: familleKeys.all })
    },
  })
}

export function useUnassignFamille(personneId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: (familleId) => unassignPersonneFamille(personneId, familleId),
    onSuccess: () => {
      invalidatePersonnes(queryClient, personneId)
      void queryClient.invalidateQueries({ queryKey: familleKeys.all })
    },
  })
}
