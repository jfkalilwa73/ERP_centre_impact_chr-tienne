export type NouveauIntegre = {
  id: string
  idFamilleDisciple: string
  nomFamille: string
  prenom: string
  nom: string
  telephone: string
  dateAccueil: string
  commentaire: string
  idDepartementIntegration: string
  nomDepartementIntegration: string
  adhesionConfirmee: boolean
}

const nouveaux: NouveauIntegre[] = []
const abonnes = new Set<() => void>()

function emettre() {
  abonnes.forEach((abonne) => abonne())
}

export function subscribeNouveauxIntegres(abonne: () => void) {
  abonnes.add(abonne)
  return () => abonnes.delete(abonne)
}

export function versionNouveauxIntegres() {
  return nouveaux.length + nouveaux.filter((item) => item.adhesionConfirmee).length
}

export function listerNouveauxIntegres(idFamilleDisciple?: string) {
  return nouveaux
    .filter((item) => !idFamilleDisciple || item.idFamilleDisciple === idFamilleDisciple)
    .map((item) => ({ ...item }))
}

export function enregistrerNouveauIntegre(input: Omit<NouveauIntegre, 'id' | 'adhesionConfirmee'>) {
  const entry: NouveauIntegre = { ...input, id: crypto.randomUUID(), adhesionConfirmee: false }
  nouveaux.unshift(entry)
  emettre()
  return { ...entry }
}

export function confirmerAdhesionNouveauIntegre(id: string) {
  const entry = nouveaux.find((item) => item.id === id)
  if (!entry || entry.adhesionConfirmee) return false
  entry.adhesionConfirmee = true
  emettre()
  return true
}
