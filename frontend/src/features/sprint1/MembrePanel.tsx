import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatDateLong } from '@/features/personnes/labels'
import { useChangerStatutMembre, useCreerMembre, useHistoriqueMembre, useMembre } from './hooks'
import { STATUT_MEMBRE_LABELS, type StatutMembre } from './types'

const STATUTS = Object.keys(STATUT_MEMBRE_LABELS) as StatutMembre[]

export function MembrePanel({ personneId, canUpdate }: { personneId: string; canUpdate: boolean }) {
  const membreQuery = useMembre(personneId)
  const membre = membreQuery.data
  const historiqueQuery = useHistoriqueMembre(membre?.idMembre)
  const creer = useCreerMembre(personneId)
  const changer = useChangerStatutMembre(personneId)
  const [dateIntegration, setDateIntegration] = useState('')
  const [statut, setStatut] = useState<StatutMembre>('en_attente')
  const [motif, setMotif] = useState('')

  const onCreer = (event: FormEvent) => {
    event.preventDefault()
    creer.mutate({ dateIntegration, statutMembre: statut })
  }

  const onChanger = (event: FormEvent) => {
    event.preventDefault()
    if (!membre) return
    changer.mutate({ membreId: membre.idMembre, statutMembre: statut, motif })
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">Membre</h2>
      <p className="mt-1 text-sm text-slate-500">
        Numéro, date d’intégration et statut enregistrés pour le Sprint 1. Le statut de la fiche personne reste distinct.
      </p>

      {membreQuery.isError && (
        <Alert className="mt-4" variant="error" title="Membre inaccessible">
          {membreQuery.error.message}
        </Alert>
      )}

      {membreQuery.isSuccess && !membre && canUpdate && (
        <form onSubmit={onCreer} className="mt-4 grid gap-3 sm:grid-cols-2">
          {creer.isError && (
            <div className="sm:col-span-2">
              <Alert variant="error" title="Enregistrement impossible">
                {creer.error.message}
              </Alert>
            </div>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
            Date d’intégration
            <Input
              type="date"
              required
              value={dateIntegration}
              onChange={(event) => setDateIntegration(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
            Statut
            <Select value={statut} onChange={(event) => setStatut(event.target.value as StatutMembre)}>
              {STATUTS.map((item) => (
                <option key={item} value={item}>
                  {STATUT_MEMBRE_LABELS[item]}
                </option>
              ))}
            </Select>
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" isLoading={creer.isPending}>
              Enregistrer comme membre
            </Button>
          </div>
        </form>
      )}

      {membreQuery.isSuccess && !membre && !canUpdate && (
        <p className="mt-4 text-sm text-slate-500">Cette personne n’a pas encore de fiche membre.</p>
      )}

      {membre && (
        <div className="mt-4 flex flex-col gap-4">
          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-slate-500">Numéro</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{membre.numeroMembre}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Intégration</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatDateLong(membre.dateIntegration)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Statut membre</dt>
              <dd className="mt-1 text-sm text-slate-900">{STATUT_MEMBRE_LABELS[membre.statutMembre]}</dd>
            </div>
          </dl>

          {canUpdate && (
            <form onSubmit={onChanger} className="grid gap-3 sm:grid-cols-2">
              {changer.isError && (
                <div className="sm:col-span-2">
                  <Alert variant="error" title="Changement impossible">
                    {changer.error.message}
                  </Alert>
                </div>
              )}
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
                Nouveau statut
                <Select value={statut} onChange={(event) => setStatut(event.target.value as StatutMembre)}>
                  {STATUTS.map((item) => (
                    <option key={item} value={item}>
                      {STATUT_MEMBRE_LABELS[item]}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
                Motif
                <Input value={motif} onChange={(event) => setMotif(event.target.value)} placeholder="Motif du changement" />
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" variant="secondary" isLoading={changer.isPending}>
                  Changer le statut
                </Button>
              </div>
            </form>
          )}

          <div>
            <h3 className="text-sm font-medium text-slate-900">Historique des statuts</h3>
            {(historiqueQuery.data ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Aucun changement enregistré.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {historiqueQuery.data?.map((ligne) => (
                  <li key={ligne.idHistorique} className="text-sm text-slate-700">
                    {ligne.ancienStatut ? STATUT_MEMBRE_LABELS[ligne.ancienStatut as StatutMembre] ?? ligne.ancienStatut : '—'}
                    {' → '}
                    {STATUT_MEMBRE_LABELS[ligne.nouveauStatut]}
                    {ligne.motif ? ` · ${ligne.motif}` : ''}
                    {ligne.changePar ? ` · ${ligne.changePar}` : ''}
                    <span className="text-slate-500"> · {formatDateLong(ligne.dateChangement)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
