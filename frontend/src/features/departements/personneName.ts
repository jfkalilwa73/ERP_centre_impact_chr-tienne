import type { Personne } from '@/types'

export function personneName(personne: Personne) {
  return `${personne.prenom} ${personne.nom}`
}
