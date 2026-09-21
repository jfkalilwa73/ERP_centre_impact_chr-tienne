/**
 * Familles d'impact : aperçu UI calqué sur le cahier des charges.
 * Le contrat Phase 0 n'expose pas encore cette ressource.
 */

export type FamilleImpact = {
  idFamille: string
  nom: string
  zone: string
}

export const famillesImpact: FamilleImpact[] = [
  { idFamille: 'f1a2b3c4-0008-4000-8000-000000000001', nom: 'Bâtisseurs', zone: 'Nord' },
  { idFamille: 'f1a2b3c4-0008-4000-8000-000000000002', nom: 'Lumières', zone: 'Sud' },
  { idFamille: 'f1a2b3c4-0008-4000-8000-000000000003', nom: 'Grâce', zone: 'Est' },
]

const familleInitiale: Record<string, string> = {
  'b2d4f6a8-0004-4000-8000-000000000001': 'f1a2b3c4-0008-4000-8000-000000000001',
  'b2d4f6a8-0004-4000-8000-000000000002': 'f1a2b3c4-0008-4000-8000-000000000002',
  'b2d4f6a8-0004-4000-8000-000000000003': 'f1a2b3c4-0008-4000-8000-000000000003',
  'b2d4f6a8-0004-4000-8000-000000000004': 'f1a2b3c4-0008-4000-8000-000000000002',
  'b2d4f6a8-0004-4000-8000-000000000006': 'f1a2b3c4-0008-4000-8000-000000000001',
  'b2d4f6a8-0004-4000-8000-000000000007': 'f1a2b3c4-0008-4000-8000-000000000001',
  'b2d4f6a8-0004-4000-8000-000000000008': 'f1a2b3c4-0008-4000-8000-000000000001',
  'b2d4f6a8-0004-4000-8000-000000000009': 'f1a2b3c4-0008-4000-8000-000000000003',
}

let personneFamille: Record<string, string> = { ...familleInitiale }

export function familleLabel(famille: FamilleImpact) {
  return `${famille.nom} (${famille.zone})`
}

export function getFamilleIdForPersonne(personneId: string) {
  return personneFamille[personneId]
}

export function getFamilleForPersonne(personneId: string) {
  const idFamille = getFamilleIdForPersonne(personneId)
  return famillesImpact.find((famille) => famille.idFamille === idFamille)
}

export function assignFamilleToPersonne(personneId: string, idFamille: string) {
  if (!idFamille) {
    delete personneFamille[personneId]
    return
  }
  personneFamille[personneId] = idFamille
}

export function resetPersonneFamilles() {
  personneFamille = { ...familleInitiale }
}
