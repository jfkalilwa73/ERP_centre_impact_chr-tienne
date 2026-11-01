import { useState, useSyncExternalStore, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { showSuccessFeedback } from '@/lib/successFeedback'
import { createCirculation } from '@/features/notifications/circulation'
import { addRapport, getRapportsVersion, listRapports, listRapportsConsolides, subscribeRapports } from './rapports'

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
  const rapports = listRapports(departementId)
  const consolides = canConsolidate ? listRapportsConsolides(consolidationIds) : []

  const [rapportTitre, setRapportTitre] = useState('')
  const [rapportDescription, setRapportDescription] = useState('')
  const [rapportCible, setRapportCible] = useState(departementId)

  const onRapport = (event: FormEvent) => {
    event.preventDefault()
    const cible = destinataires.find((item) => item.idDepartement === rapportCible)
    if (!rapportTitre.trim() || !rapportDescription.trim() || !cible || !auteur) return
    const created = addRapport({
      titre: rapportTitre,
      description: rapportDescription,
      idDepartementSource: departementId,
      nomDepartementSource: nomDepartement,
      idDepartementCible: cible.idDepartement,
      nomDepartementCible: cible.nom,
    })
    if (!created) return
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
    showSuccessFeedback('Le rapport a bien été envoyé.')
  }

  return (
    <div className="flex flex-col gap-8">
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
