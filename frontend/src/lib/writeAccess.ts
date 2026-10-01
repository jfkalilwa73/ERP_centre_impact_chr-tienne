import { canSeeAllUnits, canSeePilotageDge, isAdminFonctionnel } from '@/features/auth/orgRoles'
import { canAccessDepartementUnit } from '@/features/departements/roles'
import { canAccessFamilleUnit } from '@/features/familles/roles'
import { PERMISSIONS } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'
import type { AffectationDepartement, AffectationFamille } from '@/types'

export const MAX_LIBELLE = 200
export const MAX_DESCRIPTION = 2000
export const MAX_MONTANT = 1_000_000

/** Les tests unitaires exercent les stores sans session ; l'UI connectée reste contrôlée. */
export function isTestBypass() {
  return import.meta.env.MODE === 'test' && !useAuthStore.getState().user
}

export function currentUser() {
  return useAuthStore.getState().user
}

export function clampText(value: string, max = MAX_LIBELLE) {
  return value.trim().slice(0, max)
}

export function isValidMontant(value: number) {
  return Number.isFinite(value) && value > 0 && value <= MAX_MONTANT
}

/**
 * Vérifie si une personne dirige une unité (département ou famille) à partir de
 * ses affectations actives. Les affectations sont fournies explicitement par
 * l'appelant (issues du cache TanStack Query) pour rester sans effet de bord.
 *
 * En mode test MSW, les affectations du mockDb sont passées via les tests.
 */
export function leadsUniteFromAffectations(
  idPersonne: string,
  ownerId: string,
  affectationsDept: AffectationDepartement[],
  affectationsFamille: AffectationFamille[],
): boolean {
  const departement = affectationsDept.some(
    (affectation) =>
      affectation.actif &&
      affectation.idPersonne === idPersonne &&
      affectation.idDepartement === ownerId &&
      canAccessDepartementUnit(affectation.fonction),
  )
  if (departement) return true
  return affectationsFamille.some(
    (affectation) =>
      affectation.actif &&
      affectation.idPersonne === idPersonne &&
      affectation.idFamille === ownerId &&
      canAccessFamilleUnit(affectation.fonction),
  )
}

/**
 * Contrôle d'écriture synchrone pour les actions non-React (ex : logique métier).
 * La vérification fine d'appartenance à une unité est déléguée aux composants via
 * `useAccessScope` qui dispose du cache des affectations.
 * Ici, on autorise si l'utilisateur a un droit large (admin, pasteur, DGE).
 */
export function canMutateUnite(ownerId: string, needed: readonly string[]) {
  if (isTestBypass()) return true
  const user = currentUser()
  if (!user) return false
  if (!needed.some((code) => user.permissions.includes(code))) return false
  if (
    canSeeAllUnits(user) ||
    user.permissions.includes(PERMISSIONS.DEPARTEMENTS_UPDATE) ||
    user.permissions.includes(PERMISSIONS.FAMILLES_UPDATE)
  ) {
    return true
  }
  // Hors composant React : on ne peut pas lire le cache des affectations.
  // Le contrôle fin est géré dans les routes/composants via useAccessScope.
  // On refuse par défaut pour ne pas exposer de surface d'attaque.
  return false
}

export function canWritePilotage() {
  if (isTestBypass()) return true
  return canSeePilotageDge(currentUser())
}

export function canWriteAdmin() {
  if (isTestBypass()) return true
  return isAdminFonctionnel(currentUser())
}
