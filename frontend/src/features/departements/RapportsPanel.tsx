import { useState, useSyncExternalStore, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { createCirculation } from '@/features/notifications/circulation'
import {
  addObjectif,
  addPlanAction,
  addRapport,
  getRapportsVersion,
  listObjectifs,
  listPlansAction,
  listRapports,
  listRapportsConsolides,
  marquerPlanFait,
  subscribeRapports,
  updateObjectif,
} from './rapports'

export type Destinataire = { idDepartement: string; nom: string }

type RapportsPanelProps = {
  departementId: string
  nomDepartement: string
  destinataires: Destinataire[]
  canWrite: boolean
  canConsolidate?: boolean
  consolidationIds?: string[]
  auteur?: { idPersonne: string; nom: string }
}

export function RapportsPanel({
  departementId,
  nomDepartement,
  destinataires,
  canWrite,
  canConsolidate,
  consolidationIds = [],
  auteur,
}: RapportsPanelProps) {
  useSyncExternalStore(subscribeRapports, getRapportsVersion, getRapportsVersion)
  const objectifs = listObjectifs(departementId)
  const plans = listPlansAction(departementId)
  const rapports = listRapports(departementId)
  const consolides = canConsolidate ? listRapportsConsolides(consolidationIds) : []

  const [objectifLibelle, setObjectifLibelle] = useState('')
  const [objectifCible, setObjectifCible] = useState('')
  const [objectifEcart, setObjectifEcart] = useState('')
  const [planLibelle, setPlanLibelle] = useState('')
  const [planEcheance, setPlanEcheance] = useState('')
  const [planObjectif, setPlanObjectif] = useState('')
  const [rapportTitre, setRapportTitre] = useState('')
  const [rapportDescription, setRapportDescription] = useState('')
  const [rapportCible, setRapportCible] = useState(departementId)

  const onObjectif = (event: FormEvent) => {
    event.preventDefault()
    if (!objectifLibelle.trim()) return
    addObjectif(departementId, {
      libelle: objectifLibelle,
      cible: objectifCible,
      avancement: 0,
      ecart: objectifEcart,
    })
    setObjectifLibelle('')
    setObjectifCible('')
    setObjectifEcart('')
  }

  const onPlan = (event: FormEvent) => {
    event.preventDefault()
    if (!planLibelle.trim() || !planEcheance) return
    addPlanAction(departementId, {
      libelle: planLibelle,
      echeance: planEcheance,
      idObjectif: planObjectif || undefined,
      statut: 'ouvert',
    })
    setPlanLibelle('')
    setPlanEcheance('')
    setPlanObjectif('')
  }

  const onRapport = (event: FormEvent) => {
    event.preventDefault()
    const cible = destinataires.find((item) => item.idDepartement === rapportCible)
    if (!rapportTitre.trim() || !rapportDescription.trim() || !cible || !auteur) return
    addRapport({
      titre: rapportTitre,
      description: rapportDescription,
      idDepartementSource: departementId,
      nomDepartementSource: nomDepartement,
      idDepartementCible: cible.idDepartement,
      nomDepartementCible: cible.nom,
    })
    createCirculation({
      kind: 'rapport',
      titre: rapportTitre,
      description: rapportDescription,
      idDepartementSource: departementId,
      nomDepartementSource: nomDepartement,
      idDepartementCible: cible.idDepartement,
      nomDepartementCible: cible.nom,
      idAuteur: auteur.idPersonne,
      nomAuteur: auteur.nom,
    })
    setRapportTitre('')
    setRapportDescription('')
    setRapportCible(departementId)
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Objectifs et écarts</h2>
          <p className="mt-1 text-xs text-slate-500">Suivi des cibles du département et des écarts à renseigner.</p>
        </div>
        {canWrite && (
          <form onSubmit={onObjectif} className="grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-3">
            <Input
              value={objectifLibelle}
              onChange={(event) => setObjectifLibelle(event.target.value)}
              placeholder="Objectif"
              aria-label="Libellé de l'objectif"
            />
            <Input
              value={objectifCible}
              onChange={(event) => setObjectifCible(event.target.value)}
              placeholder="Cible"
              aria-label="Cible de l'objectif"
            />
            <Input
              value={objectifEcart}
              onChange={(event) => setObjectifEcart(event.target.value)}
              placeholder="Écart constaté"
              aria-label="Écart de l'objectif"
            />
            <Button type="submit" className="sm:col-span-3" disabled={!objectifLibelle.trim()}>
              Ajouter l'objectif
            </Button>
          </form>
        )}
        {objectifs.length === 0 ? (
          <p className="border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
            Aucun objectif pour ce département.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {objectifs.map((objectif) => (
              <li key={objectif.id} className="border border-slate-200 bg-white px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{objectif.libelle}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Cible : {objectif.cible || '—'} · Avancement {objectif.avancement} %
                </p>
                {objectif.ecart && <p className="mt-1 text-sm text-slate-600">Écart : {objectif.ecart}</p>}
                {canWrite && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={objectif.avancement}
                      aria-label={`Avancement de ${objectif.libelle}`}
                      onBlur={(event) =>
                        updateObjectif(departementId, objectif.id, {
                          avancement: Number(event.target.value) || 0,
                        })
                      }
                    />
                    <Input
                      defaultValue={objectif.ecart}
                      aria-label={`Écart de ${objectif.libelle}`}
                      placeholder="Renseigner l'écart"
                      onBlur={(event) =>
                        updateObjectif(departementId, objectif.id, { ecart: event.target.value })
                      }
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Plans d'action</h2>
          <p className="mt-1 text-xs text-slate-500">Actions concrètes pour rattraper un écart ou tenir un objectif.</p>
        </div>
        {canWrite && (
          <form onSubmit={onPlan} className="grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-3">
            <Input
              value={planLibelle}
              onChange={(event) => setPlanLibelle(event.target.value)}
              placeholder="Action"
              aria-label="Libellé du plan d'action"
            />
            <Input
              type="date"
              value={planEcheance}
              onChange={(event) => setPlanEcheance(event.target.value)}
              aria-label="Échéance du plan d'action"
            />
            <Select
              aria-label="Objectif lié"
              value={planObjectif}
              onChange={(event) => setPlanObjectif(event.target.value)}
            >
              <option value="">Sans objectif lié</option>
              {objectifs.map((objectif) => (
                <option key={objectif.id} value={objectif.id}>
                  {objectif.libelle}
                </option>
              ))}
            </Select>
            <Button type="submit" className="sm:col-span-3" disabled={!planLibelle.trim() || !planEcheance}>
              Créer le plan d'action
            </Button>
          </form>
        )}
        {plans.length === 0 ? (
          <p className="border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
            Aucun plan d'action.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{plan.libelle}</p>
                  <p className="text-xs text-slate-500">
                    {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(plan.echeance))}
                    {plan.statut === 'fait' ? ' · Fait' : ' · Ouvert'}
                  </p>
                </div>
                {canWrite && plan.statut !== 'fait' && (
                  <Button variant="secondary" size="sm" onClick={() => marquerPlanFait(departementId, plan.id)}>
                    Marquer fait
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {canConsolidate && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Consolidation des rapports</h2>
            <p className="mt-1 text-xs text-slate-500">
              Vue consolidée des rapports des départements supervisés.
            </p>
          </div>
          {consolides.length === 0 ? (
            <p className="border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
              Aucun rapport à consolider.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {consolides.map((rapport) => (
                <li key={rapport.id} className="border border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{rapport.titre}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {rapport.nomDepartementSource} → {rapport.nomDepartementCible}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{rapport.description}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Rapports</h2>
          <p className="mt-1 text-xs text-slate-500">
            Titre, description, puis le département destinataire. Le message est envoyé par défaut au
            superviseur, au pasteur et à l’administrateur. Seul le département destinataire peut
            répondre.
          </p>
        </div>
        {canWrite && (
          <form onSubmit={onRapport} className="flex flex-col gap-3 border border-slate-200 bg-white p-4">
            <Input
              value={rapportTitre}
              onChange={(event) => setRapportTitre(event.target.value)}
              placeholder="Titre du rapport"
              aria-label="Titre du rapport"
            />
            <textarea
              value={rapportDescription}
              onChange={(event) => setRapportDescription(event.target.value)}
              aria-label="Description du rapport"
              rows={4}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs"
              placeholder="Description du rapport"
            />
            <Select
              aria-label="Département destinataire"
              value={rapportCible}
              onChange={(event) => setRapportCible(event.target.value)}
            >
              <option value="">Choisir un département</option>
              {destinataires.map((item) => (
                <option key={item.idDepartement} value={item.idDepartement}>
                  {item.nom}
                </option>
              ))}
            </Select>
            <Button
              type="submit"
              disabled={!rapportTitre.trim() || !rapportDescription.trim() || !rapportCible}
            >
              Envoyer le rapport
            </Button>
          </form>
        )}
        {rapports.length === 0 ? (
          <p className="border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
            Aucun rapport produit.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rapports.map((rapport) => (
              <li key={rapport.id} className="border border-slate-200 bg-white px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{rapport.titre}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(rapport.date))}
                  {` · Destinataire : ${rapport.nomDepartementCible}`}
                  {' · Envoyé au superviseur, au pasteur et à l’administrateur'}
                </p>
                <p className="mt-1 text-sm text-slate-600">{rapport.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
