import { Link } from 'react-router-dom'
import { useSyncExternalStore } from 'react'
import type { AffectationDepartement, Personne } from '@/types'
import { PERMISSIONS } from '@/lib/permissions'
import { formatMontant, getBudgetVersion, subscribeBudget, syntheseBudget } from './budget'
import { getRapportsVersion, listObjectifs, subscribeRapports } from './rapports'
import { isLeadershipRole, roleDepartement } from './roles'
import { personneName } from './personneName'
import type { Activite } from './activites'

type Membre = { personne: Personne; affectation: AffectationDepartement }

type SupervisionSuiviProps = {
  departementId: string
  membres: Membre[]
  activites: Activite[]
  permissions: readonly string[]
}

export function SupervisionSuivi({
  departementId,
  membres,
  activites,
  permissions,
}: SupervisionSuiviProps) {
  useSyncExternalStore(subscribeBudget, getBudgetVersion, getBudgetVersion)
  useSyncExternalStore(subscribeRapports, getRapportsVersion, getRapportsVersion)

  const showAlertes = permissions.includes(PERMISSIONS.ALERTES_READ)
  const showPerformances = permissions.includes(PERMISSIONS.PERFORMANCES_READ)
  const showDemandes = permissions.includes(PERMISSIONS.DEMANDES_READ)
  const responsables = membres.filter((item) => isLeadershipRole(item.affectation.fonction))
  const budget = syntheseBudget(departementId)
  const today = new Date().toISOString().slice(0, 10)
  const echeancesDepassees = activites.filter(
    (item) => item.echeance && item.echeance < today && item.statut !== 'faite',
  )
  const budgetSerré = budget.alloue > 0 && budget.disponible / budget.alloue <= 0.2
  const depensesEnAttente = budget.engage - budget.depense
  const alertes = [
    ...echeancesDepassees.map((item) => `Échéance dépassée : ${item.titre}`),
    budgetSerré ? `Budget serré : ${formatMontant(budget.disponible)} encore disponible` : '',
    depensesEnAttente > 0 ? `${formatMontant(depensesEnAttente)} de demandes de budget en cours` : '',
  ].filter(Boolean)
  const faites = activites.filter((item) => item.statut === 'faite').length
  const tauxActivites = activites.length ? Math.round((100 * faites) / activites.length) : 0
  const objectifs = listObjectifs(departementId)
  const avancement =
    objectifs.length === 0
      ? 0
      : Math.round(objectifs.reduce((sum, item) => sum + item.avancement, 0) / objectifs.length)

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <div className="border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Responsables</h2>
        <p className="mt-1 text-xs text-slate-500">Chef et adjoints de ce département.</p>
        {responsables.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Aucun responsable affecté.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {responsables.map((item) => (
              <li key={item.personne.idPersonne} className="text-sm text-slate-700">
                <span className="font-medium text-slate-900">{personneName(item.personne)}</span>
                {' · '}
                {roleDepartement(item.affectation.fonction)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showAlertes && (
        <div className="border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Alertes</h2>
          <p className="mt-1 text-xs text-slate-500">Échéances et tension budgétaire.</p>
          {alertes.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Aucune alerte en cours.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {alertes.map((alerte) => (
                <li key={alerte} className="text-sm text-amber-800">
                  {alerte}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showPerformances && (
        <div className="border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Performances</h2>
          <p className="mt-1 text-xs text-slate-500">Activités réalisées et avancement des objectifs.</p>
          <dl className="mt-3 flex flex-col gap-2 text-sm text-slate-700">
            <div className="flex justify-between gap-3">
              <dt>Activités réalisées</dt>
              <dd className="font-medium text-slate-900">{tauxActivites} %</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Objectifs</dt>
              <dd className="font-medium text-slate-900">{avancement} %</dd>
            </div>
          </dl>
          {showDemandes && (
            <Link
              to="/notifications"
              className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Suivre les demandes
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
