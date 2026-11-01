import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/lib/apiError'
import type { Personne } from '@/types'
import {
  changerStatutMembre,
  creerMembre,
  enregistrerLien,
  enregistrerPresences,
  getMembrePersonne,
  getRegroupementPersonne,
  historiqueMembre,
  lirePresences,
  synchroniserSuivi,
} from './api'
import type { FeuillePresence, HistoriqueStatut, Membre, Regroupement, StatutMembre } from './types'

export const sprint1Keys = {
  all: ['sprint1'] as const,
  membre: (personneId: string) => [...sprint1Keys.all, 'membre', personneId] as const,
  historique: (membreId: string) => [...sprint1Keys.all, 'historique', membreId] as const,
  regroupement: (personneId: string) => [...sprint1Keys.all, 'regroupement', personneId] as const,
  presences: (familleId: string) => [...sprint1Keys.all, 'presences', familleId] as const,
}

export function useMembre(personneId: string | undefined) {
  return useQuery({
    queryKey: sprint1Keys.membre(personneId ?? ''),
    queryFn: () => getMembrePersonne(personneId!),
    enabled: Boolean(personneId),
  })
}

export function useHistoriqueMembre(membreId: string | undefined) {
  return useQuery({
    queryKey: sprint1Keys.historique(membreId ?? ''),
    queryFn: () => historiqueMembre(membreId!),
    enabled: Boolean(membreId),
  })
}

export function useRegroupement(personneId: string | undefined) {
  return useQuery({
    queryKey: sprint1Keys.regroupement(personneId ?? ''),
    queryFn: () => getRegroupementPersonne(personneId!),
    enabled: Boolean(personneId),
  })
}

export function useFeuillePresence(familleId: string | undefined) {
  return useQuery({
    queryKey: sprint1Keys.presences(familleId ?? ''),
    queryFn: () => lirePresences(familleId!),
    enabled: Boolean(familleId),
  })
}

export function useCreerMembre(personneId: string) {
  const queryClient = useQueryClient()
  return useMutation<Membre, ApiError, { dateIntegration: string; statutMembre: StatutMembre }>({
    mutationFn: (payload) => creerMembre(personneId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sprint1Keys.membre(personneId) })
    },
  })
}

export function useChangerStatutMembre(personneId: string) {
  const queryClient = useQueryClient()
  return useMutation<Membre, ApiError, { membreId: string; statutMembre: StatutMembre; motif?: string }>({
    mutationFn: ({ membreId, ...payload }) => changerStatutMembre(membreId, payload),
    onSuccess: (membre) => {
      void queryClient.invalidateQueries({ queryKey: sprint1Keys.membre(personneId) })
      void queryClient.invalidateQueries({ queryKey: sprint1Keys.historique(membre.idMembre) })
    },
  })
}

export function useEnregistrerLien(personneId: string) {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, { personne: Personne; autreId: string; lien: string }>({
    mutationFn: ({ personne, autreId, lien }) => enregistrerLien(personne, autreId, lien),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sprint1Keys.regroupement(personneId) })
    },
  })
}

export function useSynchroniserSuivi(familleId: string) {
  const queryClient = useQueryClient()
  return useMutation<{ affectations: FeuillePresence['affectations'] }, ApiError, void>({
    mutationFn: () => synchroniserSuivi(familleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sprint1Keys.presences(familleId) })
      void queryClient.invalidateQueries({ queryKey: sprint1Keys.all })
    },
  })
}

export function useEnregistrerPresences(familleId: string) {
  const queryClient = useQueryClient()
  return useMutation<
    FeuillePresence,
    ApiError,
    { dateReunion: string; lignes: { idAffectation: string; present: boolean; commentaire?: string }[] }
  >({
    mutationFn: (payload) => enregistrerPresences(familleId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(sprint1Keys.presences(familleId), data)
    },
  })
}

export type { HistoriqueStatut, Membre, Regroupement }
