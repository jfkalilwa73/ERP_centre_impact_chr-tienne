import { useSyncExternalStore } from 'react'
import { formatMontant, getBudgetVersion, subscribeBudget, syntheseBudget } from './budget'
import { StatCard } from './StatCard'

type BudgetCardsProps = {
  departementId: string
}

export function BudgetCards({ departementId }: BudgetCardsProps) {
  useSyncExternalStore(subscribeBudget, getBudgetVersion, getBudgetVersion)
  const synthese = syntheseBudget(departementId)

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Budget alloué" value={formatMontant(synthese.alloue)} hint="Enveloppe du département" />
      <StatCard label="Dépenses suivies" value={formatMontant(synthese.depense)} hint="Demandes déjà validées" />
      <StatCard
        label="Disponible"
        value={formatMontant(synthese.disponible)}
        hint={`${formatMontant(synthese.engage)} déjà engagés`}
        accent
      />
    </div>
  )
}
