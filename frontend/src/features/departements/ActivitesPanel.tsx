import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { Personne } from '@/types'
import { createCirculation } from '@/features/notifications/circulation'
import {
  addActivite,
  deleteActivite,
  marquerActiviteFaite,
  updateActivite,
  type Activite,
} from './activites'
import { personneName } from './personneName'
import type { Destinataire } from './RapportsPanel'

type ActivitesPanelProps = {
  departementId: string
  nomDepartement: string
  destinataires: Destinataire[]
  activites: Activite[]
  membres: Personne[]
  canWrite: boolean
  auteur?: { idPersonne: string; nom: string }
}

type Draft = {
  titre: string
  date: string
  echeance: string
  idResponsable: string
  description: string
  idCible: string
}

function responsableName(membres: Personne[], id: string) {
  const found = membres.find((personne) => personne.idPersonne === id)
  return found ? personneName(found) : ''
}

export function ActivitesPanel({
  departementId,
  nomDepartement,
  destinataires,
  activites,
  membres,
  canWrite,
  auteur,
}: ActivitesPanelProps) {
  const emptyDraft: Draft = {
    titre: '',
    date: '',
    echeance: '',
    idResponsable: '',
    description: '',
    idCible: departementId,
  }
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [editing, setEditing] = useState<Activite | null>(null)
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft)

  const onAdd = (event: FormEvent) => {
    event.preventDefault()
    const cible = destinataires.find((item) => item.idDepartement === draft.idCible)
    if (!draft.titre.trim() || !draft.date || !cible || !auteur) return
    addActivite(departementId, {
      titre: draft.titre,
      date: draft.date,
      description: draft.description,
      idResponsable: draft.idResponsable || undefined,
      nomResponsable: responsableName(membres, draft.idResponsable),
      echeance: draft.echeance || undefined,
    })
    createCirculation({
      kind: 'activite',
      titre: draft.titre,
      description: draft.description || `Activité prévue le ${draft.date}.`,
      idDepartementSource: departementId,
      nomDepartementSource: nomDepartement,
      idDepartementCible: cible.idDepartement,
      nomDepartementCible: cible.nom,
      idAuteur: auteur.idPersonne,
      nomAuteur: auteur.nom,
    })
    setDraft(emptyDraft)
  }

  const openEdit = (activite: Activite) => {
    setEditing(activite)
    setEditDraft({
      titre: activite.titre,
      date: activite.date,
      echeance: activite.echeance ?? '',
      idResponsable: activite.idResponsable ?? '',
      description: activite.description,
      idCible: departementId,
    })
  }

  const onEdit = (event: FormEvent) => {
    event.preventDefault()
    if (!editing || !editDraft.titre.trim() || !editDraft.date) return
    updateActivite(departementId, editing.id, {
      titre: editDraft.titre,
      date: editDraft.date,
      description: editDraft.description,
      idResponsable: editDraft.idResponsable,
      nomResponsable: responsableName(membres, editDraft.idResponsable),
      echeance: editDraft.echeance,
    })
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {canWrite && (
        <form onSubmit={onAdd} className="border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Nouvelle activité</h2>
          <p className="mt-1 text-xs text-slate-500">
            L’activité est envoyée au superviseur, au pasteur et à l’administrateur. Seul le
            département destinataire peut répondre.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              value={draft.titre}
              onChange={(event) => setDraft((current) => ({ ...current, titre: event.target.value }))}
              placeholder="Réunion d'équipe"
              aria-label="Titre de l'activité"
            />
            <Input
              type="date"
              value={draft.date}
              onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
              aria-label="Date de l'activité"
            />
            <Input
              type="date"
              value={draft.echeance}
              onChange={(event) => setDraft((current) => ({ ...current, echeance: event.target.value }))}
              aria-label="Échéance de l'activité"
            />
            <Select
              aria-label="Responsable de l'activité"
              value={draft.idResponsable}
              onChange={(event) =>
                setDraft((current) => ({ ...current, idResponsable: event.target.value }))
              }
            >
              <option value="">Sans responsable</option>
              {membres.map((personne) => (
                <option key={personne.idPersonne} value={personne.idPersonne}>
                  {personneName(personne)}
                </option>
              ))}
            </Select>
            <Input
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Description (optionnel)"
              aria-label="Description de l'activité"
              className="sm:col-span-2"
            />
            <Select
              aria-label="Département destinataire"
              value={draft.idCible}
              onChange={(event) =>
                setDraft((current) => ({ ...current, idCible: event.target.value }))
              }
              className="sm:col-span-2"
            >
              <option value="">Choisir un département</option>
              {destinataires.map((item) => (
                <option key={item.idDepartement} value={item.idDepartement}>
                  {item.nom}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" className="mt-4">
            <Plus className="size-4" aria-hidden="true" />
            Ajouter l'activité
          </Button>
        </form>
      )}

      {activites.length === 0 ? (
        <p className="border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
          Aucune activité pour ce département.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {activites.map((activite) => (
            <li
              key={activite.id}
              className="flex items-start justify-between gap-3 border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{activite.titre}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(activite.date))}
                  {activite.echeance
                    ? ` · Échéance ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(activite.echeance))}`
                    : ''}
                  {activite.statut === 'faite' ? ' · Faite' : ' · Planifiée'}
                  {activite.nomResponsable ? ` · ${activite.nomResponsable}` : ''}
                </p>
                {activite.description && (
                  <p className="mt-1 text-sm text-slate-600">{activite.description}</p>
                )}
              </div>
              {canWrite && (
                <div className="flex gap-1">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(activite)}>
                    Modifier
                  </Button>
                  {activite.statut !== 'faite' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => marquerActiviteFaite(departementId, activite.id)}
                    >
                      Marquer faite
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    aria-label="Supprimer l'activité"
                    onClick={() => deleteActivite(departementId, activite.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent title="Modifier l'activité" description="Mettez à jour le planning, le responsable ou l’échéance.">
          <form onSubmit={onEdit} className="flex flex-col gap-3">
            <Input
              value={editDraft.titre}
              onChange={(event) => setEditDraft((current) => ({ ...current, titre: event.target.value }))}
              aria-label="Titre de l'activité"
            />
            <Input
              type="date"
              value={editDraft.date}
              onChange={(event) => setEditDraft((current) => ({ ...current, date: event.target.value }))}
              aria-label="Date de l'activité"
            />
            <Input
              type="date"
              value={editDraft.echeance}
              onChange={(event) =>
                setEditDraft((current) => ({ ...current, echeance: event.target.value }))
              }
              aria-label="Échéance de l'activité"
            />
            <Select
              aria-label="Responsable de l'activité"
              value={editDraft.idResponsable}
              onChange={(event) =>
                setEditDraft((current) => ({ ...current, idResponsable: event.target.value }))
              }
            >
              <option value="">Sans responsable</option>
              {membres.map((personne) => (
                <option key={personne.idPersonne} value={personne.idPersonne}>
                  {personneName(personne)}
                </option>
              ))}
            </Select>
            <Input
              value={editDraft.description}
              onChange={(event) =>
                setEditDraft((current) => ({ ...current, description: event.target.value }))
              }
              aria-label="Description de l'activité"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
