import { useState, useSyncExternalStore, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { showSuccessFeedback } from '@/lib/successFeedback'
import {
  addObjectif,
  addPlanAction,
  getRapportsVersion,
  listObjectifs,
  listPlansAction,
  marquerPlanFait,
  subscribeRapports,
} from './rapports'

type ObjectifsPanelProps = {
  departementId: string
  canWrite: boolean
}

export function ObjectifsPanel({ departementId, canWrite }: ObjectifsPanelProps) {
  useSyncExternalStore(subscribeRapports, getRapportsVersion, getRapportsVersion)
  const objectifs = listObjectifs(departementId)
  const plans = listPlansAction(departementId)

  const [libelle, setLibelle] = useState('')
  const [cible, setCible] = useState('')
  const [avancement, setAvancement] = useState('0')
  const [ecart, setEcart] = useState('')
  const [planLibelle, setPlanLibelle] = useState('')
  const [planEcheance, setPlanEcheance] = useState('')
  const [planObjectif, setPlanObjectif] = useState('')

  const onObjectif = (event: FormEvent) => {
    event.preventDefault()
    if (!libelle.trim() || !cible.trim()) return
    const created = addObjectif(departementId, {
      libelle,
      cible,
      avancement: Number(avancement) || 0,
      ecart,
    })
    if (!created) return
    setLibelle('')
    setCible('')
    setAvancement('0')
    setEcart('')
    showSuccessFeedback("L’objectif a bien été enregistré.")
  }

  const onPlan = (event: FormEvent) => {
    event.preventDefault()
    if (!planLibelle.trim() || !planEcheance) return
    const created = addPlanAction(departementId, {
      libelle: planLibelle,
      echeance: planEcheance,
      statut: 'ouvert',
      idObjectif: planObjectif || undefined,
    })
    if (!created) return
    setPlanLibelle('')
    setPlanEcheance('')
    setPlanObjectif('')
    showSuccessFeedback("Le plan d’action a bien été créé.")
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Objectifs et écarts</h2>
          <p className="mt-1 text-xs text-slate-500">
            Cible, avancement et écart pour chaque objectif de l’unité.
          </p>
        </div>
        {canWrite && (
          <form onSubmit={onObjectif} className="grid gap-3 border border-slate-200 bg-white p-4 md:grid-cols-2">
            <Input
              value={libelle}
              onChange={(event) => setLibelle(event.target.value)}
              placeholder="Objectif"
              aria-label="Libellé de l’objectif"
            />
            <Input
              value={cible}
              onChange={(event) => setCible(event.target.value)}
              placeholder="Cible"
              aria-label="Cible de l’objectif"
            />
            <Input
              type="number"
              min={0}
              max={100}
              value={avancement}
              onChange={(event) => setAvancement(event.target.value)}
              aria-label="Avancement de l’objectif"
            />
            <Input
              value={ecart}
              onChange={(event) => setEcart(event.target.value)}
              placeholder="Écart constaté"
              aria-label="Écart de l’objectif"
            />
            <Button type="submit" className="md:col-span-2" disabled={!libelle.trim() || !cible.trim()}>
              Enregistrer l’objectif
            </Button>
          </form>
        )}
        {objectifs.length === 0 ? (
          <p className="border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
            Aucun objectif suivi pour le moment.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {objectifs.map((objectif) => (
              <li key={objectif.id} className="border border-slate-200 bg-white px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{objectif.libelle}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Cible : {objectif.cible} · Avancement : {objectif.avancement} %
                </p>
                {objectif.ecart && <p className="mt-1 text-sm text-slate-600">{objectif.ecart}</p>}
                <div className="mt-2 h-1.5 bg-slate-100">
                  <div className="h-full bg-brand-500" style={{ width: `${objectif.avancement}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Plans d’action</h2>
          <p className="mt-1 text-xs text-slate-500">Actions pour rattraper les écarts.</p>
        </div>
        {canWrite && (
          <form onSubmit={onPlan} className="grid gap-3 border border-slate-200 bg-white p-4 md:grid-cols-2">
            <Input
              value={planLibelle}
              onChange={(event) => setPlanLibelle(event.target.value)}
              placeholder="Action à mener"
              aria-label="Libellé du plan d’action"
            />
            <Input
              type="date"
              value={planEcheance}
              onChange={(event) => setPlanEcheance(event.target.value)}
              aria-label="Échéance du plan d’action"
            />
            <select
              aria-label="Objectif lié au plan"
              value={planObjectif}
              onChange={(event) => setPlanObjectif(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">Sans objectif lié</option>
              {objectifs.map((objectif) => (
                <option key={objectif.id} value={objectif.id}>
                  {objectif.libelle}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={!planLibelle.trim() || !planEcheance}>
              Créer le plan d’action
            </Button>
          </form>
        )}
        {plans.length === 0 ? (
          <p className="border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
            Aucun plan d’action.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {plans.map((plan) => (
              <li key={plan.id} className="flex items-start justify-between gap-3 border border-slate-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{plan.libelle}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Échéance : {plan.echeance} · {plan.statut === 'fait' ? 'Fait' : 'Ouvert'}
                  </p>
                </div>
                {canWrite && plan.statut === 'ouvert' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (marquerPlanFait(departementId, plan.id)) {
                        showSuccessFeedback("Le plan d’action a été marqué comme terminé.")
                      }
                    }}
                  >
                    Marquer fait
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
