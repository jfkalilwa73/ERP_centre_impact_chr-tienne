import { listAllActivites } from './activites'
import { formatMontant, syntheseBudget } from './budget'
import { listAllObjectifs } from './rapports'
import { listAllActivitesFamille } from '@/features/familles/activites'

export function indicateursUnites(ids: string[]) {
  const filtre = new Set(ids)
  const activites = [
    ...listAllActivites().filter((item) => filtre.has(item.idDepartement)),
    ...listAllActivitesFamille().filter((item) => filtre.has(item.idFamille)),
  ]
  const faites = activites.filter((item) => item.statut === 'faite').length
  const planifiees = activites.filter((item) => item.statut === 'planifiee').length
  const budgets = ids.map((id) => syntheseBudget(id))
  const alloue = budgets.reduce((sum, item) => sum + item.alloue + item.rentrees, 0)
  const depense = budgets.reduce((sum, item) => sum + item.depense, 0)
  const objectifs = listAllObjectifs(ids)
  const enCours = objectifs.filter((item) => item.avancement < 100).length

  return {
    activites: activites.length,
    faites,
    planifiees,
    budgetAlloue: alloue,
    budgetDepense: depense,
    budgetLibelle: `${formatMontant(depense)} / ${formatMontant(alloue)}`,
    objectifs: objectifs.length,
    objectifsEnCours: enCours,
  }
}
