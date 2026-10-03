import { useState, useSyncExternalStore, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
  createCirculation,
  getCirculationsVersion,
  kindLabel,
  listCirculations,
  subscribeCirculations,
} from '@/features/notifications/circulation'
import { getRapportsVersion, listAllRapports, subscribeRapports } from './rapports'

export const DGE_SOURCE = { idDepartement: 'dge', nom: 'DGE' }

type Destinataire = { idDepartement: string; nom: string }

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
}

export function DgeSuiviPanel({
  departements,
  auteur,
  libelleUnite = 'département',
  filtreIds,
}: {
  departements: Destinataire[]
  auteur: { idPersonne: string; nom: string }
  libelleUnite?: 'département' | 'famille'
  filtreIds?: string[]
}) {
  useSyncExternalStore(subscribeCirculations, getCirculationsVersion, getCirculationsVersion)

  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [cible, setCible] = useState('')

  const destinataires = departements.filter((item) => item.idDepartement !== DGE_SOURCE.idDepartement)
  const destIds = new Set(filtreIds ?? destinataires.map((item) => item.idDepartement))
  const demandes = listCirculations().filter((item) => {
    if (item.kind !== 'budget' && item.kind !== 'demande') return false
    if (!filtreIds) return true
    return destIds.has(item.idDepartementSource) || destIds.has(item.idDepartementCible)
  })

  const onDemande = (event: FormEvent) => {
    event.preventDefault()
    const dest = destinataires.find((item) => item.idDepartement === cible)
    if (!titre.trim() || !description.trim() || !dest) return
    createCirculation({
      kind: 'demande',
      titre,
      description,
      idDepartementSource: DGE_SOURCE.idDepartement,
      nomDepartementSource: DGE_SOURCE.nom,
      idDepartementCible: dest.idDepartement,
      nomDepartementCible: dest.nom,
      idAuteur: auteur.idPersonne,
      nomAuteur: auteur.nom,
    })
    setTitre('')
    setDescription('')
    setCible('')
  }

  return (
    <section className="flex flex-col gap-5 border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Suivi DGE</h2>
        <p className="mt-1 text-xs text-slate-500">
          Les demandes faites par chaque {libelleUnite}, et celles que vous leur adressez.
        </p>
      </div>

      <form onSubmit={onDemande} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <Input
          value={titre}
          onChange={(event) => setTitre(event.target.value)}
          placeholder="Titre de la demande"
          aria-label={`Titre de la demande ${libelleUnite === 'famille' ? 'à la famille' : 'au département'}`}
        />
        <Select
          aria-label={`${libelleUnite === 'famille' ? 'Famille' : 'Département'} destinataire de la demande`}
          value={cible}
          onChange={(event) => setCible(event.target.value)}
        >
          <option value="">
            {libelleUnite === 'famille' ? 'Choisir une famille' : 'Choisir un département'}
          </option>
          {destinataires.map((item) => (
            <option key={item.idDepartement} value={item.idDepartement}>
              {item.nom}
            </option>
          ))}
        </Select>
        <Button type="submit" disabled={!titre.trim() || !description.trim() || !cible}>
          Envoyer la demande
        </Button>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          aria-label={`Description de la demande ${libelleUnite === 'famille' ? 'à la famille' : 'au département'}`}
          rows={3}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs md:col-span-3"
          placeholder={`Précisez ce que ${libelleUnite === 'famille' ? 'la famille' : 'le département'} doit faire ou transmettre.`}
        />
      </form>

      <SuiviTable
        title="Demandes"
        empty={`Aucune demande de ${libelleUnite} ni du DGE.`}
        rows={demandes.map((item) => ({
          id: item.id,
          titre: item.titre,
          meta: `${kindLabel(item.kind)} · ${item.nomDepartementSource} → ${item.nomDepartementCible} · ${formatDate(item.dateCreation)}`,
          description: item.description,
        }))}
      />
    </section>
  )
}

export function DgeRapportsPanel({
  filtreIds,
  libelleUnite = 'départements',
}: {
  filtreIds?: string[]
  libelleUnite?: string
} = {}) {
  useSyncExternalStore(subscribeRapports, getRapportsVersion, getRapportsVersion)
  const rapports = listAllRapports().filter(
    (item) =>
      !filtreIds ||
      filtreIds.includes(item.idDepartementSource) ||
      filtreIds.includes(item.idDepartementCible),
  )

  return (
    <section className="flex flex-col gap-5 border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Rapports reçus</h2>
        <p className="mt-1 text-xs text-slate-500">
          Tous les rapports transmis par les {libelleUnite}.
        </p>
      </div>
      <SuiviTable
        title="Rapports"
        empty="Aucun rapport transmis pour le moment."
        rows={rapports.map((item) => ({
          id: item.id,
          titre: item.titre,
          meta: `${item.nomDepartementSource} → ${item.nomDepartementCible} · ${formatDate(item.date)}`,
          description: item.description,
        }))}
      />
    </section>
  )
}

function SuiviTable({
  title,
  empty,
  rows,
}: {
  title: string
  empty: string
  rows: { id: string; titre: string; meta: string; description: string }[]
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          {empty}
        </p>
      ) : (
        <div className="mt-3 overflow-hidden border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2 font-medium">Objet</th>
                <th className="px-3 py-2 font-medium">Circuit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0 align-top">
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-900">{row.titre}</p>
                    <p className="mt-1 text-slate-600">{row.description}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">{row.meta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
