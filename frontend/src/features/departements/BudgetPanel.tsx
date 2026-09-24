import { useState, useSyncExternalStore, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { createCirculation } from '@/features/notifications/circulation'
import {
  demanderDepense,
  formatMontant,
  getBudgetVersion,
  listDepenses,
  statutDepenseLabel,
  subscribeBudget,
} from './budget'
import type { Destinataire } from './RapportsPanel'

type BudgetPanelProps = {
  departementId: string
  nomDepartement: string
  destinataires: Destinataire[]
  canRequest: boolean
  auteur?: { idPersonne: string; nom: string }
}

export function BudgetPanel({
  departementId,
  nomDepartement,
  destinataires,
  canRequest,
  auteur,
}: BudgetPanelProps) {
  useSyncExternalStore(subscribeBudget, getBudgetVersion, getBudgetVersion)
  const [motif, setMotif] = useState('')
  const [montant, setMontant] = useState('')
  const [cibleId, setCibleId] = useState(departementId)
  const depenses = listDepenses(departementId)

  const onDemander = (event: FormEvent) => {
    event.preventDefault()
    const value = Number(montant.replace(',', '.'))
    const cible = destinataires.find((item) => item.idDepartement === cibleId)
    if (!motif.trim() || !Number.isFinite(value) || value <= 0 || !cible || !auteur) return
    demanderDepense(departementId, { motif, montant: value })
    createCirculation({
      kind: 'budget',
      titre: motif,
      description: `${formatMontant(value)} demandés par ${nomDepartement}.`,
      idDepartementSource: departementId,
      nomDepartementSource: nomDepartement,
      idDepartementCible: cible.idDepartement,
      nomDepartementCible: cible.nom,
      idAuteur: auteur.idPersonne,
      nomAuteur: auteur.nom,
    })
    setMotif('')
    setMontant('')
    setCibleId(departementId)
  }

  return (
    <div className="flex flex-col gap-6">
      {canRequest && (
        <form onSubmit={onDemander} className="border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Demander une dépense</h2>
          <p className="mt-1 text-xs text-slate-500">
            La demande est envoyée au superviseur, au pasteur et à l’administrateur. Seul le
            département destinataire peut répondre.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Input
              value={motif}
              onChange={(event) => setMotif(event.target.value)}
              placeholder="Motif"
              aria-label="Motif de la dépense"
              className="sm:col-span-2"
            />
            <Input
              type="number"
              min="1"
              step="0.01"
              value={montant}
              onChange={(event) => setMontant(event.target.value)}
              placeholder="Montant"
              aria-label="Montant de la dépense"
            />
            <Select
              aria-label="Département destinataire"
              value={cibleId}
              onChange={(event) => setCibleId(event.target.value)}
              className="sm:col-span-3"
            >
              <option value="">Choisir un département</option>
              {destinataires.map((item) => (
                <option key={item.idDepartement} value={item.idDepartement}>
                  {item.nom}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" className="mt-4" disabled={!motif.trim() || !montant || !cibleId}>
            Envoyer la demande
          </Button>
        </form>
      )}

      {depenses.length === 0 ? (
        <p className="border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
          Aucune dépense suivie pour ce département.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Motif</th>
              <th className="px-4 py-3 font-medium">Montant</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {depenses.map((depense) => (
              <tr key={depense.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">{depense.motif}</td>
                <td className="px-4 py-3 text-slate-600">{formatMontant(depense.montant)}</td>
                <td className="px-4 py-3 text-slate-600">{statutDepenseLabel(depense.statut)}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(depense.date))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
