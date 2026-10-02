import { useSyncExternalStore } from 'react'
import { formatMontant, getBudgetVersion, subscribeBudget, syntheseBudget } from './budget'
import { StatCard } from './StatCard'

type BudgetCardsProps = {
  departementId: string
  hintEnveloppe?: string
}

export function BudgetCards({
  departementId,
  hintEnveloppe = 'Enveloppe du département',
}: BudgetCardsProps) {
  useSyncExternalStore(subscribeBudget, getBudgetVersion, getBudgetVersion)
  const synthese = syntheseBudget(departementId)

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Budget alloué" value={formatMontant(synthese.alloue)} hint={hintEnveloppe} />
      <StatCard
        label="Rentrées d'argent"
        value={formatMontant(synthese.rentrees)}
        hint="Enregistrées dans la caisse"
      />
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
