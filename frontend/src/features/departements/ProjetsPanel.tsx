import { useState, useSyncExternalStore, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { showSuccessFeedback } from '@/lib/successFeedback'
import {
  addProjet,
  addRisque,
  getProjetsVersion,
  graviteLabel,
  listProjets,
  listRisques,
  projetStatutLabel,
  risqueStatutLabel,
  subscribeProjets,
  type Gravite,
  type ProjetStatut,
  type RisqueStatut,
} from './projets'

type ProjetsPanelProps = {
  departementId: string
  nomDepartement: string
  canWrite: boolean
}

export function ProjetsPanel({ departementId, nomDepartement, canWrite }: ProjetsPanelProps) {
  useSyncExternalStore(subscribeProjets, getProjetsVersion, getProjetsVersion)
  const projets = listProjets(departementId)

  const [code, setCode] = useState('')
  const [titre, setTitre] = useState('')
  const [responsable, setResponsable] = useState('')
  const [budget, setBudget] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [risqueProjet, setRisqueProjet] = useState('')
  const [risqueLibelle, setRisqueLibelle] = useState('')
  const [risqueMitigation, setRisqueMitigation] = useState('')

  const onProjet = (event: FormEvent) => {
    event.preventDefault()
    if (!code.trim() || !titre.trim() || !responsable.trim() || !dateFin) return
    const created = addProjet(departementId, nomDepartement, {
      code,
      titre,
      responsable,
      budget: Number(budget) || 0,
      statut: 'en_cours' satisfies ProjetStatut,
      priorite: 'moyenne',
      progression: 0,
      dateFin,
    })
    if (!created) return
    setCode('')
    setTitre('')
    setResponsable('')
    setBudget('')
    setDateFin('')
    showSuccessFeedback('Le projet a bien été créé.')
  }

  const onRisque = (event: FormEvent) => {
    event.preventDefault()
    if (!risqueProjet || !risqueLibelle.trim()) return
    const created = addRisque(risqueProjet, {
      libelle: risqueLibelle,
      probabilite: 'moyenne' satisfies Gravite,
      impact: 'moyenne',
      statut: 'ouvert' satisfies RisqueStatut,
      mitigation: risqueMitigation,
    })
    if (!created) return
    setRisqueLibelle('')
    setRisqueMitigation('')
    showSuccessFeedback('Le risque a bien été enregistré.')
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Projets de l’unité</h2>
          <p className="mt-1 text-xs text-slate-500">
            Portefeuille, jalons, budget et risques rattachés à cette unité.
          </p>
        </div>
        {canWrite && (
          <form onSubmit={onProjet} className="grid gap-3 border border-slate-200 bg-white p-4 md:grid-cols-2">
            <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Code" aria-label="Code du projet" />
            <Input value={titre} onChange={(event) => setTitre(event.target.value)} placeholder="Titre" aria-label="Titre du projet" />
            <Input
              value={responsable}
              onChange={(event) => setResponsable(event.target.value)}
              placeholder="Responsable"
              aria-label="Responsable du projet"
            />
            <Input
              type="number"
              min={0}
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              placeholder="Budget"
              aria-label="Budget du projet"
            />
            <Input type="date" value={dateFin} onChange={(event) => setDateFin(event.target.value)} aria-label="Date de fin du projet" />
            <Button type="submit" disabled={!code.trim() || !titre.trim() || !responsable.trim() || !dateFin}>
              Créer le projet
            </Button>
          </form>
        )}
        {projets.length === 0 ? (
          <p className="border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
            Aucun projet rattaché à cette unité.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {projets.map((projet) => {
              const risques = listRisques(projet.id)
              return (
                <li key={projet.id} className="border border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">
                    {projet.code} — {projet.titre}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {projet.responsable} · {projetStatutLabel(projet.statut)} · priorité {graviteLabel(projet.priorite)} ·
                    fin {projet.dateFin}
                  </p>
                  <div className="mt-2 h-1.5 bg-slate-100">
                    <div className="h-full bg-brand-500" style={{ width: `${projet.progression}%` }} />
                  </div>
                  {risques.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-1">
                      {risques.map((risque) => (
                        <li key={risque.id} className="text-sm text-slate-600">
                          Risque : {risque.libelle} · {risqueStatutLabel(risque.statut)} · {risque.mitigation}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {canWrite && projets.length > 0 && (
        <form onSubmit={onRisque} className="grid gap-3 border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Ajouter un risque</h2>
          <Select aria-label="Projet du risque" value={risqueProjet} onChange={(event) => setRisqueProjet(event.target.value)}>
            <option value="">Choisir un projet</option>
            {projets.map((projet) => (
              <option key={projet.id} value={projet.id}>
                {projet.titre}
              </option>
            ))}
          </Select>
          <Input
            value={risqueLibelle}
            onChange={(event) => setRisqueLibelle(event.target.value)}
            placeholder="Risque"
            aria-label="Libellé du risque"
          />
          <Input
            value={risqueMitigation}
            onChange={(event) => setRisqueMitigation(event.target.value)}
            placeholder="Mesure de mitigation"
            aria-label="Mitigation du risque"
          />
          <Button type="submit" disabled={!risqueProjet || !risqueLibelle.trim()}>
            Enregistrer le risque
          </Button>
        </form>
      )}
    </div>
  )
}
