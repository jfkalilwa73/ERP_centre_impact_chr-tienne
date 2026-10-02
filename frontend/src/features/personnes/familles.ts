import type { AffectationFamille, FamilleImpact } from '@/types'

export { familleLabel } from '@/features/familles/schema'

export function activeFamilleId(affectations: AffectationFamille[] | undefined) {
  return affectations?.find((affectation) => affectation.actif)?.idFamille
}

export function familleById(familles: FamilleImpact[], idFamille: string | undefined) {
  if (!idFamille) return undefined
  return familles.find((famille) => famille.idFamille === idFamille)
}
