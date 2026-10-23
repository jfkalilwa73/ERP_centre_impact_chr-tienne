export type StatutMembre = 'actif' | 'inactif' | 'en_attente' | 'archive'

export type TypeRelation = 'conjoint' | 'parent' | 'enfant' | 'tuteur' | 'frere_soeur' | 'autre'

export type Membre = {
  idMembre: string
  idPersonne: string
  numeroMembre: string
  dateIntegration: string
  statutMembre: StatutMembre
  dateChangementStatut?: string | null
  motifChangementStatut?: string | null
  familleImpactId?: string | null
  nom?: string | null
  prenom?: string | null
}

export type HistoriqueStatut = {
  idHistorique: string
  idMembre: string
  ancienStatut?: string | null
  nouveauStatut: StatutMembre
  motif?: string | null
  changePar?: string | null
  dateChangement: string
}

export type RelationFamiliale = {
  idRelation: string
  idPersonne1: string
  idPersonne2: string
  prenom1?: string | null
  nom1?: string | null
  prenom2?: string | null
  nom2?: string | null
  typeRelation: TypeRelation
  dateDebut?: string
  actif: boolean
}

export type Regroupement = {
  idFamille: string
  nomFamille: string
  adresse?: string | null
  telephonePrincipal?: string | null
  responsableLegalId?: string | null
  relations: RelationFamiliale[]
}

export type AffectationSuivie = {
  idAffectation: string
  idMembre: string
  idPersonne?: string | null
  numeroMembre?: string | null
  nom?: string | null
  prenom?: string | null
  dateDebut?: string
  actif: boolean
}

export type PresenceReunion = {
  idPresence: string
  idAffectation: string
  idPersonne?: string | null
  nom?: string | null
  prenom?: string | null
  dateReunion: string
  present: boolean
  commentaire?: string | null
}

export type FeuillePresence = {
  affectations: AffectationSuivie[]
  presences: PresenceReunion[]
}

export const STATUT_MEMBRE_LABELS: Record<StatutMembre, string> = {
  en_attente: 'En attente',
  actif: 'Actif',
  inactif: 'Inactif',
  archive: 'Archivé',
}

export const TYPE_RELATION_LABELS: Record<TypeRelation, string> = {
  conjoint: 'Conjoint',
  parent: 'Parent',
  enfant: 'Enfant',
  tuteur: 'Tuteur',
  frere_soeur: 'Frère ou sœur',
  autre: 'Autre',
}

export const LIEN_VERS_RELATION: Record<string, TypeRelation> = {
  Conjoint: 'conjoint',
  Enfant: 'enfant',
  Parent: 'parent',
  Frère: 'frere_soeur',
  Sœur: 'frere_soeur',
}
