const STORAGE_KEY = 'icc-familles-disciples-date-culte'

function dateLocale() {
  const date = new Date()
  const decalage = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - decalage).toISOString().slice(0, 10)
}

function dateInitiale() {
  try {
    const stockee = window.sessionStorage.getItem(STORAGE_KEY)
    if (stockee && /^\d{4}-\d{2}-\d{2}$/.test(stockee)) return stockee
  } catch {
    // Le repli local permet aussi de fonctionner si le stockage du navigateur est indisponible.
  }
  return dateLocale()
}

let dateCulte = dateInitiale()
const abonnes = new Set<() => void>()

export function getDateChecklistCulte() {
  return dateCulte
}

export function subscribeDateChecklistCulte(abonne: () => void) {
  abonnes.add(abonne)
  return () => abonnes.delete(abonne)
}

export function setDateChecklistCulte(nouvelleDate: string) {
  if (!nouvelleDate || nouvelleDate === dateCulte) return
  dateCulte = nouvelleDate
  try {
    window.sessionStorage.setItem(STORAGE_KEY, nouvelleDate)
  } catch {
    // La synchronisation reste active en mémoire pour la session courante.
  }
  abonnes.forEach((abonne) => abonne())
}
