const STORAGE_KEY = 'icc-departement-charge-integration'
const PEOPLE_STORAGE_KEY = 'icc-departement-gestion-personnes'
const abonnes = new Set<() => void>()
let sessionId: string | null = null
let initialisationFaite = false
let sessionPeopleDepartment: { id: string; nom: string } | null = null
let initialisationPeopleFaite = false

function lireIdDepartement() {
  if (initialisationFaite) return sessionId
  initialisationFaite = true
  try {
    sessionId = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    sessionId = null
  }
  return sessionId
}

export function getDepartementIntegrationId() {
  return lireIdDepartement()
}

export function subscribeDepartementIntegration(abonne: () => void) {
  abonnes.add(abonne)
  return () => abonnes.delete(abonne)
}

export function setDepartementIntegrationId(id: string | null) {
  initialisationFaite = true
  sessionId = id
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id)
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Le choix reste valable pour la session même si le stockage du navigateur est bloqué.
  }
  abonnes.forEach((abonne) => abonne())
}

export function getDepartementGestionPersonnes() {
  if (initialisationPeopleFaite) return sessionPeopleDepartment
  initialisationPeopleFaite = true
  try {
    const saved = window.localStorage.getItem(PEOPLE_STORAGE_KEY)
    sessionPeopleDepartment = saved ? JSON.parse(saved) as { id: string; nom: string } : null
  } catch {
    sessionPeopleDepartment = null
  }
  return sessionPeopleDepartment
}

export function setDepartementGestionPersonnes(departement: { id: string; nom: string } | null) {
  initialisationPeopleFaite = true
  sessionPeopleDepartment = departement
  try {
    if (departement) window.localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(departement))
    else window.localStorage.removeItem(PEOPLE_STORAGE_KEY)
  } catch {
    // Le choix reste disponible pour la session si le stockage local est bloqué.
  }
  abonnes.forEach((abonne) => abonne())
}
