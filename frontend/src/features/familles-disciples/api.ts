import { api } from '@/lib/apiClient'
import { ApiError } from '@/lib/apiError'
import {
  admettreNouveauVenuSimule,
  enregistrerChecklistSimulee,
  enregistrerSuiviSimule,
  listerFamillesSimulees,
  obtenirChecklistSimulee,
  obtenirFamillePersonneSimulee,
  obtenirFamilleSimulee,
  obtenirSuiviSimule,
  modifierStatutMembreFamilleSimulee,
  retirerMembreFamilleSimulee,
} from './simulation'

export type CompositionFamilleDisciple = {
  idComposition: string
  idMembre: string
  idPersonne?: string
  numeroMembre?: string | null
  prenom?: string | null
  nom?: string | null
  nouveauVenu?: boolean
  dateAccueil?: string | null
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
  modeSimulation?: boolean
}

export type FamillesDisciplesPage = {
  data: FamilleDisciple[]
  pagination?: { page: number; limit: number; total: number }
  modeSimulation?: boolean
}

export type PersonneFamilleDisciple = {
  idFamilleDisciple: string
  nomFamilleDisciple: string
  dateAccueil: string
  nouveauVenu: boolean
  statut: 'actif' | 'termine' | 'archive'
  modeSimulation?: boolean
}

export type TypeCulte = 'dimanche' | 'mercredi' | 'vendredi'
export type StatutPresenceDisciple = 'a_confirmer' | 'present' | 'absent' | 'excuse'

export type SuiviPresenceDisciple = {
  idPersonne: string
  prenom: string
  nom: string
  telephone?: string | null
  nouveauVenu: boolean
  dateAccueil?: string | null
  statutPresence: StatutPresenceDisciple
  justificationAbsence?: string | null
  presenceDimancheSuivant?: boolean | null
}

export type SuiviPresenceCulte = {
  typeCulte: TypeCulte
  dateCulte: string
  dateDimancheSuivant?: string | null
  membres: SuiviPresenceDisciple[]
  modeSimulation?: boolean
}

export type ChecklistDepartementCulte = {
  idDepartement: string
  nomDepartement: string
  pret: boolean
  commentaire?: string | null
}

export type ChecklistPreparationCulte = {
  dateCulte: string
  departements: ChecklistDepartementCulte[]
  modeSimulation?: boolean
}

function estRouteAbsente(error: unknown) {
  return error instanceof ApiError && error.status === 404
}

export async function listFamillesDisciples(): Promise<FamillesDisciplesPage> {
  try {
    const { data } = await api.get<FamillesDisciplesPage>('/familles-disciples')
    return data
  } catch (error) {
    if (estRouteAbsente(error)) return listerFamillesSimulees()
    throw error
  }
}

export async function getFamilleDisciple(id: string): Promise<FamilleDisciple> {
  try {
    const { data } = await api.get<FamilleDisciple>(`/familles-disciples/${id}`)
    return data
  } catch (error) {
    if (!estRouteAbsente(error)) throw error
    const simulee = obtenirFamilleSimulee(id)
    if (simulee) return simulee
    throw error
  }
}

export async function admettreNouveauVenu(
  familleId: string,
  payload: { idPersonne: string; dateAccueil: string; nouveauVenu?: boolean; prenom?: string; nom?: string },
) {
  try {
    const { data } = await api.post<CompositionFamilleDisciple>(
      `/familles-disciples/${familleId}/membres`,
      { idPersonne: payload.idPersonne, dateAccueil: payload.dateAccueil, nouveauVenu: payload.nouveauVenu ?? true },
    )
    return data
  } catch (error) {
    if (!estRouteAbsente(error)) throw error
    const simule = admettreNouveauVenuSimule(familleId, payload)
    if (simule) return simule
    throw error
  }
}

export async function retirerMembreFamille(familleId: string, compositionId: string) {
  try {
    await api.delete(`/familles-disciples/${familleId}/membres/${compositionId}`)
    return true
  } catch (error) {
    if (!estRouteAbsente(error)) throw error
    if (retirerMembreFamilleSimulee(familleId, compositionId)) return true
    throw error
  }
}

export async function modifierStatutMembreFamille(
  familleId: string,
  compositionId: string,
  payload: { nouveauVenu: boolean; actif: boolean },
) {
  try {
    const { data } = await api.patch<CompositionFamilleDisciple>(
      `/familles-disciples/${familleId}/membres/${compositionId}`,
      payload,
    )
    return data
  } catch (error) {
    if (!estRouteAbsente(error)) throw error
    const simule = modifierStatutMembreFamilleSimulee(familleId, compositionId, payload)
    if (simule) return simule
    throw error
  }
}

export async function getFamilleDiscipleDePersonne(personneId: string) {
  try {
    const { data } = await api.get<PersonneFamilleDisciple | null>(
      `/personnes/${personneId}/famille-disciple`,
    )
    return data
  } catch (error) {
    if (!estRouteAbsente(error)) throw error
    return obtenirFamillePersonneSimulee(personneId)
  }
}

export async function getSuiviPresenceCulte(
  familleId: string,
  params: { dateCulte: string; typeCulte: TypeCulte },
): Promise<SuiviPresenceCulte> {
  try {
    const { data } = await api.get<SuiviPresenceCulte>(
      `/familles-disciples/${familleId}/presences`,
      { params },
    )
    return data
  } catch (error) {
    if (!estRouteAbsente(error)) throw error
    return obtenirSuiviSimule(familleId, params)
  }
}

export async function enregistrerSuiviPresenceCulte(
  familleId: string,
  payload: SuiviPresenceCulte,
): Promise<SuiviPresenceCulte> {
  try {
    const { data } = await api.put<SuiviPresenceCulte>(
      `/familles-disciples/${familleId}/presences`,
      payload,
    )
    return data
  } catch (error) {
    if (!estRouteAbsente(error)) throw error
    return enregistrerSuiviSimule(familleId, payload)
  }
}

export async function getChecklistPreparationCulte(familleId: string, dateCulte: string) {
  try {
    const { data } = await api.get<ChecklistPreparationCulte>(
      `/familles-disciples/${familleId}/checklist-culte`,
      { params: { dateCulte } },
    )
    return data
  } catch (error) {
    if (!estRouteAbsente(error)) throw error
    return obtenirChecklistSimulee(familleId, dateCulte)
  }
}

export async function enregistrerChecklistPreparationCulte(
  familleId: string,
  payload: ChecklistPreparationCulte,
) {
  try {
    const { data } = await api.put<ChecklistPreparationCulte>(
      `/familles-disciples/${familleId}/checklist-culte`,
      payload,
    )
    return data
  } catch (error) {
    if (!estRouteAbsente(error)) throw error
    return enregistrerChecklistSimulee(familleId, payload)
  }
}
