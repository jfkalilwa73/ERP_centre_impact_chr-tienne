import { api } from '@/lib/apiClient'
import { ApiError } from '@/lib/apiError'
import type { Personne } from '@/types'
import {
  LIEN_VERS_RELATION,
  type FeuillePresence,
  type HistoriqueStatut,
  type Membre,
  type Regroupement,
  type StatutMembre,
} from './types'

type PageMembres = {
  data: Membre[]
  pagination: { page: number; limit: number; total: number }
}

async function nulSiAbsent<T>(demande: Promise<T>): Promise<T | null> {
  try {
    return await demande
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export function getMembrePersonne(personneId: string) {
  return nulSiAbsent(api.get<Membre>(`/personnes/${personneId}/membre`).then((response) => response.data))
}

export async function creerMembre(
  personneId: string,
  payload: { dateIntegration: string; statutMembre: StatutMembre },
) {
  const { data } = await api.post<Membre>(`/personnes/${personneId}/membre`, payload)
  return data
}

export async function changerStatutMembre(
  membreId: string,
  payload: { statutMembre: StatutMembre; motif?: string },
) {
  const { data } = await api.patch<Membre>(`/membres/${membreId}`, payload)
  return data
}

export async function historiqueMembre(membreId: string) {
  const { data } = await api.get<HistoriqueStatut[]>(`/membres/${membreId}/historique`)
  return data
}

export function getRegroupementPersonne(personneId: string) {
  return nulSiAbsent(
    api.get<Regroupement>(`/personnes/${personneId}/regroupement`).then((response) => response.data),
  )
}

export async function creerRegroupement(payload: {
  nomFamille: string
  adresse?: string | null
  telephonePrincipal?: string | null
  responsableLegalId?: string | null
}) {
  const { data } = await api.post<Regroupement>('/regroupements', payload)
  return data
}

export async function ajouterRelation(
  regroupementId: string,
  payload: { idPersonne1: string; idPersonne2: string; typeRelation: string },
) {
  const { data } = await api.post<Regroupement['relations'][number]>(
    `/regroupements/${regroupementId}/relations`,
    payload,
  )
  return data
}

export async function retirerRelation(regroupementId: string, relationId: string) {
  await api.delete(`/regroupements/${regroupementId}/relations/${relationId}`)
}

export async function enregistrerLien(personne: Personne, autreId: string, lien: string) {
  let regroupement = await getRegroupementPersonne(personne.idPersonne)
  if (!regroupement) {
    regroupement = await creerRegroupement({
      nomFamille: `Famille ${personne.nom}`,
      adresse: personne.adresse ?? null,
      telephonePrincipal: personne.telephone ?? null,
      responsableLegalId: personne.idPersonne,
    })
  }

  const existante = regroupement.relations.find(
    (relation) =>
      (relation.idPersonne1 === personne.idPersonne && relation.idPersonne2 === autreId) ||
      (relation.idPersonne2 === personne.idPersonne && relation.idPersonne1 === autreId),
  )

  if (!lien) {
    if (existante) await retirerRelation(regroupement.idFamille, existante.idRelation)
    return
  }

  const typeRelation = LIEN_VERS_RELATION[lien]
  if (!typeRelation || existante?.typeRelation === typeRelation) return

  await ajouterRelation(regroupement.idFamille, {
    idPersonne1: personne.idPersonne,
    idPersonne2: autreId,
    typeRelation,
  })
}

export async function synchroniserSuivi(familleId: string) {
  const { data } = await api.post<{ affectations: FeuillePresence['affectations'] }>(
    `/familles-impact/${familleId}/suivi`,
  )
  return data
}

export async function lirePresences(familleId: string): Promise<FeuillePresence> {
  const { data } = await api.get<FeuillePresence>(`/familles-impact/${familleId}/presences`)
  return data
}

export async function enregistrerPresences(
  familleId: string,
  payload: {
    dateReunion: string
    lignes: { idAffectation: string; present: boolean; commentaire?: string }[]
  },
) {
  const { data } = await api.put<FeuillePresence>(`/familles-impact/${familleId}/presences`, payload)
  return data
}

export async function listMembres(params: { page?: number; q?: string; statut?: string } = {}) {
  const { data } = await api.get<PageMembres>('/membres', { params })
  return data
}
