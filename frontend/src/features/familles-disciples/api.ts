import { api } from '@/lib/apiClient'

export type CompositionFamilleDisciple = {
  idComposition: string
  idMembre: string
  numeroMembre?: string | null
  prenom?: string | null
  nom?: string | null
  departementOrigineId: string
  departementOrigineNom: string
  actif: boolean
}

export type FamilleDisciple = {
  idFamilleDisciple: string
  nom: string
  periodeDebut: string
  periodeFin?: string | null
  responsableId?: string | null
  responsableNom?: string | null
  statut: 'actif' | 'termine' | 'archive'
  nbDepartementsRepresentes?: number
  nbDepartementsActifsTotal?: number
  statutCompletude?: 'COMPLET' | 'INCOMPLET'
  compositions?: CompositionFamilleDisciple[]
}

export type FamillesDisciplesPage = {
  data: FamilleDisciple[]
  pagination?: { page: number; limit: number; total: number }
}

export async function listFamillesDisciples(): Promise<FamillesDisciplesPage> {
  const { data } = await api.get<FamillesDisciplesPage>('/familles-disciples')
  return data
}

export async function getFamilleDisciple(id: string): Promise<FamilleDisciple> {
  const { data } = await api.get<FamilleDisciple>(`/familles-disciples/${id}`)
  return data
}
