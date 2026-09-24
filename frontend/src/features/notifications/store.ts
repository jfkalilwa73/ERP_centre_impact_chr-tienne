export type DemandeSuperviseurStatut = 'en_attente' | 'traitee' | 'refusee'

export type DemandeSuperviseur = {
  id: string
  idPersonneCible: string
  nomCible: string
  idDepartement: string
  nomDepartement: string
  idDemandeur: string
  nomDemandeur: string
  statut: DemandeSuperviseurStatut
  emailCree?: string
  dateCreation: string
  dateTraitement?: string
  luAdmin: boolean
  luDemandeur: boolean
}

const listeners = new Set<() => void>()
let version = 0
let demandes: DemandeSuperviseur[] = []

function emit() {
  version += 1
  listeners.forEach((listener) => listener())
}

export function subscribeDemandes(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getDemandesVersion() {
  return version
}

export function listDemandes() {
  return [...demandes].sort((left, right) => right.dateCreation.localeCompare(left.dateCreation))
}

export function findDemandeEnAttente(idPersonneCible: string, idDepartement: string) {
  return demandes.find(
    (demande) =>
      demande.statut === 'en_attente' &&
      demande.idPersonneCible === idPersonneCible &&
      demande.idDepartement === idDepartement,
  )
}

export function createDemandeSuperviseur(input: {
  idPersonneCible: string
  nomCible: string
  idDepartement: string
  nomDepartement: string
  idDemandeur: string
  nomDemandeur: string
}) {
  const existing = findDemandeEnAttente(input.idPersonneCible, input.idDepartement)
  if (existing) return existing

  const created: DemandeSuperviseur = {
    id: crypto.randomUUID(),
    ...input,
    statut: 'en_attente',
    dateCreation: new Date().toISOString(),
    luAdmin: false,
    luDemandeur: false,
  }
  demandes = [created, ...demandes]
  emit()
  return created
}

export function traiterDemandeSuperviseur(id: string, emailCree: string) {
  const found = demandes.find((demande) => demande.id === id)
  if (!found || found.statut !== 'en_attente') return
  found.statut = 'traitee'
  found.emailCree = emailCree
  found.dateTraitement = new Date().toISOString()
  found.luAdmin = true
  found.luDemandeur = false
  emit()
}

export function refuserDemandeSuperviseur(id: string) {
  const found = demandes.find((demande) => demande.id === id)
  if (!found || found.statut !== 'en_attente') return
  found.statut = 'refusee'
  found.dateTraitement = new Date().toISOString()
  found.luAdmin = true
  found.luDemandeur = false
  emit()
}

export function markDemandesLues(input: { admin?: boolean; idDemandeur?: string }) {
  demandes.forEach((demande) => {
    if (input.admin) demande.luAdmin = true
    if (input.idDemandeur && demande.idDemandeur === input.idDemandeur) demande.luDemandeur = true
  })
  emit()
}

export function unreadDemandesCount(input: { isAdmin: boolean; idPersonne?: string }) {
  return demandes.filter((demande) => {
    if (input.isAdmin) return demande.statut === 'en_attente' && !demande.luAdmin
    return (
      Boolean(input.idPersonne) &&
      demande.idDemandeur === input.idPersonne &&
      demande.statut !== 'en_attente' &&
      !demande.luDemandeur
    )
  }).length
}

export function resetDemandes() {
  demandes = []
  emit()
}
