import { useState, useSyncExternalStore, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { showSuccessFeedback } from '@/lib/successFeedback'
import { createCirculation } from '@/features/notifications/circulation'
import { addRapport } from './rapports'
import {
  CAISSE_EGLISE,
  demanderDepense,
  enregistrerRentree,
  formatMontant,
  getBudgetVersion,
  listDepenses,
  listRentrees,
  statutDepenseLabel,
  subscribeBudget,
  syntheseBudget,
  type SourceCaisse,
} from './budget'

type BudgetPanelProps = {
  departementId: string
  nomDepartement: string
  canRequest: boolean
  auteur?: { idPersonne: string; nom: string }
  unite?: 'departement' | 'famille'
}

export function BudgetPanel({
  departementId,
  nomDepartement,
  canRequest,
  auteur,
  unite = 'departement',
}: BudgetPanelProps) {
  const caisseUnite = unite === 'famille' ? 'Caisse de la famille' : 'Caisse du département'
  const libelleUnite = unite === 'famille' ? 'famille' : 'département'
  useSyncExternalStore(subscribeBudget, getBudgetVersion, getBudgetVersion)
  const [motif, setMotif] = useState('')
  const [montant, setMontant] = useState('')
  const [source, setSource] = useState<SourceCaisse>('departement')
  const [motifRentree, setMotifRentree] = useState('')
  const [montantRentree, setMontantRentree] = useState('')
  const [erreur, setErreur] = useState<string>()
  const depenses = listDepenses(departementId)
  const rentrees = listRentrees(departementId)
  const disponible = syntheseBudget(departementId).disponible

  const onDemander = (event: FormEvent) => {
    event.preventDefault()
    const value = Number(montant.replace(',', '.'))
    if (!motif.trim() || !Number.isFinite(value) || value <= 0 || !auteur) return
    const created = demanderDepense(departementId, { motif, montant: value, source })
    if (!created) {
      setErreur(
        source === 'departement'
          ? 'Montant supérieur au disponible de la caisse, ou action non autorisée.'
          : 'Action non autorisée.',
      )
      return
    }
    setErreur(undefined)
    if (source === 'eglise') {
      createCirculation({
        kind: 'budget',
        titre: motif,
        description: `${formatMontant(value)} demandés par ${nomDepartement} à la caisse de l’Église.`,
        idDepartementSource: departementId,
        nomDepartementSource: nomDepartement,
        idDepartementCible: CAISSE_EGLISE.idDepartement,
        nomDepartementCible: CAISSE_EGLISE.nom,
        idAuteur: auteur.idPersonne,
        nomAuteur: auteur.nom,
      })
    }
    setMotif('')
    setMontant('')
    setSource('departement')
    showSuccessFeedback('La demande de dépense a bien été envoyée.')
  }

  const onRentree = (event: FormEvent) => {
    event.preventDefault()
    const value = Number(montantRentree.replace(',', '.'))
    if (!motifRentree.trim() || !Number.isFinite(value) || value <= 0 || !auteur) return
    const created = enregistrerRentree(departementId, { motif: motifRentree, montant: value })
    if (!created) {
      setErreur('Action non autorisée ou montant invalide.')
      return
    }
    setErreur(undefined)
    const titre = `Rentrée d'argent : ${motifRentree.trim()}`
    const description = `${formatMontant(value)} enregistrés dans la ${caisseUnite.toLowerCase()} (${nomDepartement}).`
    addRapport({
      titre,
      description,
      idDepartementSource: departementId,
      nomDepartementSource: nomDepartement,
      idDepartementCible: departementId,
      nomDepartementCible: nomDepartement,
    })
    createCirculation({
      kind: 'rapport',
      titre,
      description,
      idDepartementSource: departementId,
      nomDepartementSource: nomDepartement,
      idDepartementCible: departementId,
      nomDepartementCible: nomDepartement,
      idAuteur: auteur.idPersonne,
      nomAuteur: auteur.nom,
    })
    setMotifRentree('')
    setMontantRentree('')
    showSuccessFeedback('La rentrée a bien été enregistrée.')
  }

  return (
    <div className="flex flex-col gap-6">
      {erreur && <Alert variant="error">{erreur}</Alert>}
      {canRequest && (
        <form onSubmit={onRentree} className="border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Enregistrer une rentrée</h2>
          <p className="mt-1 text-xs text-slate-500">
            Les rentrées alimentent uniquement la {caisseUnite.toLowerCase()}. Un rapport est
            transmis au superviseur, au pasteur et à l’administrateur.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Input
              value={motifRentree}
              onChange={(event) => setMotifRentree(event.target.value)}
              placeholder="Offrande, cotisation…"
              aria-label="Motif de la rentrée"
              className="sm:col-span-2"
            />
            <Input
              type="number"
              min="1"
              step="0.01"
              value={montantRentree}
              onChange={(event) => setMontantRentree(event.target.value)}
              placeholder="Montant"
              aria-label="Montant de la rentrée"
            />
          </div>
          <Button type="submit" className="mt-4" disabled={!motifRentree.trim() || !montantRentree}>
            Enregistrer la rentrée
          </Button>
        </form>
      )}

      {canRequest && (
        <form onSubmit={onDemander} className="border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Demander une dépense</h2>
          <p className="mt-1 text-xs text-slate-500">
            Chaque {libelleUnite} a sa caisse. Pour la caisse principale de l’Église, une demande est
            envoyée à {CAISSE_EGLISE.nom}.
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
              aria-label="Source des fonds"
              value={source}
              onChange={(event) => setSource(event.target.value as SourceCaisse)}
              className="sm:col-span-3"
            >
              <option value="departement">
                {caisseUnite} ({formatMontant(disponible)})
              </option>
              <option value="eglise">{CAISSE_EGLISE.nom}</option>
            </Select>
          </div>
          <Button type="submit" className="mt-4" disabled={!motif.trim() || !montant}>
            Envoyer la demande
          </Button>
        </form>
      )}

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Rentrées d'argent</h2>
        {rentrees.length === 0 ? (
          <p className="mt-3 border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
            Aucune rentrée enregistrée pour {unite === 'famille' ? 'cette famille' : 'ce département'}.
          </p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Motif</th>
                <th className="px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium">Caisse</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rentrees.map((rentree) => (
                <tr key={rentree.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{rentree.motif}</td>
                  <td className="px-4 py-3 text-slate-600">{formatMontant(rentree.montant)}</td>
                  <td className="px-4 py-3 text-slate-600">{caisseUnite}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(rentree.date))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Dépenses</h2>
        {depenses.length === 0 ? (
          <p className="mt-3 border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
            Aucune dépense suivie pour {unite === 'famille' ? 'cette famille' : 'ce département'}.
          </p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Motif</th>
                <th className="px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium">Caisse</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {depenses.map((depense) => (
                <tr key={depense.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{depense.motif}</td>
                  <td className="px-4 py-3 text-slate-600">{formatMontant(depense.montant)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {depense.source === 'eglise' ? CAISSE_EGLISE.nom : caisseUnite}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{statutDepenseLabel(depense.statut)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(depense.date))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
