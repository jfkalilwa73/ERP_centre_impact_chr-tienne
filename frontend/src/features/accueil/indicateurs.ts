export type PointCulte = {
  id: string
  titre: string
  fait: boolean
}

export type LigneCulte = {
  id: string
  nom: string
  faits: number
  total: number
  points: PointCulte[]
}

export function estPointCulte(titre: string) {
  return /culte/i.test(titre)
}

export function estOffrande(motif: string) {
  return /offrande/i.test(motif)
}

export function estDime(motif: string) {
  return /d[iî]mes?/i.test(motif)
}

export function sommeMotifs(
  rentrees: { motif: string; montant: number }[],
  correspond: (motif: string) => boolean,
) {
  return rentrees.reduce((sum, item) => sum + (correspond(item.motif) ? item.montant : 0), 0)
}

export function cleMois(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function estDansMois(valeur: string | undefined, maintenant = new Date()) {
  return Boolean(valeur && valeur.startsWith(cleMois(maintenant)))
}

export function indicationMois(total: number) {
  return `+${total} ce mois`
}

export function sommeMois(
  rentrees: { motif: string; montant: number; date: string }[],
  correspond: (motif: string) => boolean,
  maintenant = new Date(),
) {
  return sommeMotifs(
    rentrees.filter((item) => estDansMois(item.date, maintenant)),
    correspond,
  )
}

export function inscriptionsCeMois(personnes: { dateCreation?: string }[], maintenant = new Date()) {
  return personnes.filter((personne) => estDansMois(personne.dateCreation, maintenant)).length
}

export function estResponsable(fonction?: string) {
  const value = (fonction ?? '').trim().toLowerCase()
  if (!value) return false
  return value.includes('superviseur') || value.includes('adjoint') || value.includes('chef') || value.includes('responsable')
}

export function nombreResponsables(
  affectations: { idPersonne: string; fonction?: string; actif?: boolean }[],
) {
  const personnes = new Set<string>()
  for (const affectation of affectations) {
    if (affectation.actif === false || !estResponsable(affectation.fonction)) continue
    personnes.add(affectation.idPersonne)
  }
  return personnes.size
}

export function effectifUnite(
  affectations: { idUnite: string; idPersonne: string; actif?: boolean }[],
  idUnite: string,
) {
  const personnes = new Set<string>()
  for (const affectation of affectations) {
    if (affectation.actif === false || affectation.idUnite !== idUnite) continue
    personnes.add(affectation.idPersonne)
  }
  return personnes.size
}

export function entreesUniteCeMois(
  affectations: { idUnite: string; idPersonne: string; dateDebut?: string }[],
  idUnite: string,
  maintenant = new Date(),
) {
  const personnes = new Set<string>()
  for (const affectation of affectations) {
    if (affectation.idUnite !== idUnite || !estDansMois(affectation.dateDebut, maintenant)) continue
    personnes.add(affectation.idPersonne)
  }
  return personnes.size
}

export function responsablesCeMois(
  affectations: { idPersonne: string; fonction?: string; dateDebut?: string; actif?: boolean }[],
  maintenant = new Date(),
) {
  const personnes = new Set<string>()
  for (const affectation of affectations) {
    if (affectation.actif === false || !estResponsable(affectation.fonction)) continue
    if (!estDansMois(affectation.dateDebut, maintenant)) continue
    personnes.add(affectation.idPersonne)
  }
  return personnes.size
}

export function progressionCultes(
  departements: { id: string; nom: string }[],
  activites: { id: string; idDepartement: string; titre: string; statut: 'planifiee' | 'faite' }[],
) {
  const lignes: LigneCulte[] = departements.map((departement) => {
    const points = activites
      .filter((item) => item.idDepartement === departement.id && estPointCulte(item.titre))
      .map((item) => ({ id: item.id, titre: item.titre, fait: item.statut === 'faite' }))
    return {
      id: departement.id,
      nom: departement.nom,
      faits: points.filter((item) => item.fait).length,
      total: points.length,
      points,
    }
  })
  const concernees = lignes.filter((item) => item.total > 0)
  const total = concernees.reduce((sum, item) => sum + item.total, 0)
  const faits = concernees.reduce((sum, item) => sum + item.faits, 0)
  return {
    valeur: total === 0 ? 0 : Math.round((faits / total) * 100),
    faits,
    total,
    lignes: concernees,
  }
}

export function contributionsMensuelles(
  rentrees: { montant: number; date: string }[],
  maintenant = new Date(),
  nombreMois = 6,
) {
  const mois = Array.from({ length: nombreMois }, (_, index) => {
    const date = new Date(maintenant.getFullYear(), maintenant.getMonth() - (nombreMois - 1 - index), 1)
    const cle = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const libelle = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date).replace('.', '')
    return { cle, mois: libelle, montant: 0 }
  })
  const index = new Map(mois.map((item) => [item.cle, item]))
  for (const rentree of rentrees) {
    const cible = index.get(rentree.date.slice(0, 7))
    if (cible) cible.montant += rentree.montant
  }
  return mois.map(({ mois: libelle, montant }) => ({ mois: libelle, montant }))
}

const AGE_ENFANT = 18

function ageEnAnnees(dateNaissance: string | null | undefined, maintenant: Date) {
  if (!dateNaissance) return null
  const naissance = new Date(`${dateNaissance.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(naissance.getTime())) return null
  let age = maintenant.getFullYear() - naissance.getFullYear()
  const mois = maintenant.getMonth() - naissance.getMonth()
  if (mois < 0 || (mois === 0 && maintenant.getDate() < naissance.getDate())) age -= 1
  return age
}

export function repartitionMembres(
  personnes: { sexe?: string | null; dateNaissance?: string | null; statut?: string | null }[],
  maintenant = new Date(),
) {
  const comptes = { Hommes: 0, Femmes: 0, Enfants: 0 }
  for (const personne of personnes) {
    if (personne.statut === 'archive') continue
    const age = ageEnAnnees(personne.dateNaissance, maintenant)
    if (age !== null && age < AGE_ENFANT) {
      comptes.Enfants += 1
      continue
    }
    if (personne.sexe === 'M') comptes.Hommes += 1
    else if (personne.sexe === 'F') comptes.Femmes += 1
  }
  return [
    { nom: 'Hommes', total: comptes.Hommes },
    { nom: 'Femmes', total: comptes.Femmes },
    { nom: 'Enfants', total: comptes.Enfants },
  ]
}

export function croissanceEglise(
  personnes: { dateCreation?: string | null; statut?: string | null }[],
  maintenant = new Date(),
  nombreMois = 12,
) {
  return Array.from({ length: nombreMois }, (_, index) => {
    const debut = new Date(maintenant.getFullYear(), maintenant.getMonth() - (nombreMois - 1 - index), 1)
    const fin = new Date(debut.getFullYear(), debut.getMonth() + 1, 0)
    const limite = `${fin.getFullYear()}-${String(fin.getMonth() + 1).padStart(2, '0')}-${String(fin.getDate()).padStart(2, '0')}`
    const effectif = personnes.filter((personne) => {
      if (personne.statut === 'archive' || !personne.dateCreation) return false
      return personne.dateCreation.slice(0, 10) <= limite
    }).length
    const mois = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(debut).replace('.', '')
    return { mois, effectif }
  })
}

export function repartitionZones(familles: { zone?: string | null }[]) {
  const comptes = new Map<string, number>()
  for (const famille of familles) {
    const zone = famille.zone?.trim() || 'Sans zone'
    comptes.set(zone, (comptes.get(zone) ?? 0) + 1)
  }
  return [...comptes.entries()]
    .map(([zone, total]) => ({ zone, total }))
    .sort((left, right) => right.total - left.total || left.zone.localeCompare(right.zone, 'fr'))
}
