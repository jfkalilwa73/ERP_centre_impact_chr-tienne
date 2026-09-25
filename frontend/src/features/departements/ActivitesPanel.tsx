import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { Personne } from '@/types'
import { createCirculation } from '@/features/notifications/circulation'
import { notifyMembresActivite, retirerRappelActivite } from './activiteNotifications'
import {
  CONCERNES,
  JOURS_SEMAINE,
  addActivite,
  concerneLabel,
  deleteActivite,
  marquerActiviteFaite,
  messageRappel,
  resumeActivite,
  updateActivite,
  type Activite,
  type ActiviteConcerne,
  type ActiviteModalite,
  type ActiviteRecurrence,
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
  concerne: ActiviteConcerne
  recurrence: ActiviteRecurrence
  jours: number[]
  heure: string
  modalite: ActiviteModalite | ''
}

const emptyDraft = (departementId: string): Draft => ({
  titre: '',
  date: '',
  echeance: '',
  idResponsable: '',
  description: '',
  idCible: departementId,
  concerne: 'equipe',
  recurrence: 'unique',
  jours: [],
  heure: '',
  modalite: '',
})

function responsableName(membres: Personne[], id: string) {
  const found = membres.find((personne) => personne.idPersonne === id)
  return found ? personneName(found) : ''
}

function toggleJour(jours: number[], jour: number) {
  return jours.includes(jour) ? jours.filter((item) => item !== jour) : [...jours, jour]
}

function toActiviteFields(draft: Draft, membres: Personne[]) {
  return {
    titre: draft.titre,
    date: draft.date,
    description: draft.description,
    idResponsable: draft.idResponsable,
    nomResponsable: responsableName(membres, draft.idResponsable),
    echeance: draft.recurrence === 'constante' ? '' : draft.echeance,
    concerne: draft.concerne,
    recurrence: draft.recurrence,
    jours: draft.recurrence === 'constante' ? draft.jours : [],
    heure: draft.heure,
    modalite: (draft.modalite || undefined) as ActiviteModalite | undefined,
  }
}

function draftFromActivite(activite: Activite, departementId: string): Draft {
  return {
    titre: activite.titre,
    date: activite.date,
    echeance: activite.echeance ?? '',
    idResponsable: activite.idResponsable ?? '',
    description: activite.description,
    idCible: departementId,
    concerne: activite.concerne ?? 'equipe',
    recurrence: activite.recurrence ?? 'unique',
    jours: activite.jours ?? [],
    heure: activite.heure ?? '',
    modalite: activite.modalite ?? '',
  }
}

function draftValide(draft: Draft) {
  if (!draft.titre.trim() || !draft.date) return false
  if (draft.recurrence === 'constante' && (!draft.jours.length || !draft.heure)) return false
  return true
}

function ActiviteFields({
  draft,
  onChange,
  membres,
  destinataires,
  withDestinataire,
}: {
  draft: Draft
  onChange: (next: Draft) => void
  membres: Personne[]
  destinataires: Destinataire[]
  withDestinataire?: boolean
}) {
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch })

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input
        value={draft.titre}
        onChange={(event) => set({ titre: event.target.value })}
        placeholder="Répétition, prière…"
        aria-label="Titre de l'activité"
      />
      <Select
        aria-label="Cette activité concerne"
        value={draft.concerne}
        onChange={(event) => set({ concerne: event.target.value as ActiviteConcerne })}
      >
        {CONCERNES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Type d'activité"
        value={draft.recurrence}
        onChange={(event) =>
          set({
            recurrence: event.target.value as ActiviteRecurrence,
            jours: event.target.value === 'constante' ? draft.jours : [],
          })
        }
      >
        <option value="unique">Unique</option>
        <option value="constante">Constante</option>
      </Select>
      <Input
        type="date"
        value={draft.date}
        onChange={(event) => set({ date: event.target.value })}
        aria-label={draft.recurrence === 'constante' ? "Date de début de l'activité" : "Date de l'activité"}
      />
      {draft.recurrence === 'constante' ? (
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-xs text-slate-500">Jours de l’activité</legend>
          <div className="flex flex-wrap gap-2">
            {JOURS_SEMAINE.map((jour) => {
              const checked = draft.jours.includes(jour.value)
              return (
                <label
                  key={jour.value}
                  className={`inline-flex items-center gap-2 border px-3 py-1.5 text-sm ${
                    checked ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    aria-label={`Jour : ${jour.label}`}
                    onChange={() => set({ jours: toggleJour(draft.jours, jour.value) })}
                  />
                  {jour.label}
                </label>
              )
            })}
          </div>
        </fieldset>
      ) : (
        <Input
          type="date"
          value={draft.echeance}
          onChange={(event) => set({ echeance: event.target.value })}
          aria-label="Échéance de l'activité"
        />
      )}
      <Input
        type="time"
        value={draft.heure}
        onChange={(event) => set({ heure: event.target.value })}
        aria-label="Heure de l'activité"
      />
      <Select
        aria-label="Modalité"
        value={draft.modalite}
        onChange={(event) => set({ modalite: event.target.value as ActiviteModalite | '' })}
      >
        <option value="">Modalité non précisée</option>
        <option value="presentiel">Présentiel</option>
        <option value="en_ligne">En ligne</option>
      </Select>
      <Select
        aria-label="Responsable de l'activité"
        value={draft.idResponsable}
        onChange={(event) => set({ idResponsable: event.target.value })}
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
        onChange={(event) => set({ description: event.target.value })}
        placeholder="Petite description (besoin, lieu, consignes…)"
        aria-label="Description de l'activité"
        className={withDestinataire ? undefined : 'sm:col-span-2'}
      />
      {withDestinataire && (
        <Select
          aria-label="Département destinataire"
          value={draft.idCible}
          onChange={(event) => set({ idCible: event.target.value })}
        >
          <option value="">Choisir un département</option>
          {destinataires.map((item) => (
            <option key={item.idDepartement} value={item.idDepartement}>
              {item.nom}
            </option>
          ))}
        </Select>
      )}
    </div>
  )
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
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(departementId))
  const [editing, setEditing] = useState<Activite | null>(null)
  const [editDraft, setEditDraft] = useState<Draft>(() => emptyDraft(departementId))
  const membreIds = membres.map((personne) => personne.idPersonne)

  const onAdd = (event: FormEvent) => {
    event.preventDefault()
    const cible = destinataires.find((item) => item.idDepartement === draft.idCible)
    if (!draftValide(draft) || !cible || !auteur) return
    const created = addActivite(departementId, toActiviteFields(draft, membres))
    createCirculation({
      kind: 'activite',
      titre: draft.titre,
      description: draft.description || messageRappel(created),
      idDepartementSource: departementId,
      nomDepartementSource: nomDepartement,
      idDepartementCible: cible.idDepartement,
      nomDepartementCible: cible.nom,
      idAuteur: auteur.idPersonne,
      nomAuteur: auteur.nom,
    })
    notifyMembresActivite({
      activite: created,
      departementId,
      nomDepartement,
      membreIds,
      auteur,
    })
    setDraft(emptyDraft(departementId))
  }

  const openEdit = (activite: Activite) => {
    setEditing(activite)
    setEditDraft(draftFromActivite(activite, departementId))
  }

  const onEdit = (event: FormEvent) => {
    event.preventDefault()
    if (!editing || !draftValide(editDraft) || !auteur) return
    const updated = updateActivite(departementId, editing.id, toActiviteFields(editDraft, membres))
    if (updated) {
      notifyMembresActivite({
        activite: updated,
        departementId,
        nomDepartement,
        membreIds,
        auteur,
      })
    }
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {canWrite && (
        <form onSubmit={onAdd} className="border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Nouvelle activité</h2>
          <p className="mt-1 text-xs text-slate-500">
            Une activité constante (répétition, prière…) se crée une fois, puis se modifie si besoin.
            Chaque membre du département est prévenu de l’horaire.
          </p>
          <div className="mt-4">
            <ActiviteFields
              draft={draft}
              onChange={setDraft}
              membres={membres}
              destinataires={destinataires}
              withDestinataire
            />
          </div>
          <Button type="submit" className="mt-4" disabled={!draftValide(draft)}>
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
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{activite.titre}</p>
                  {activite.recurrence === 'constante' && (
                    <span className="border border-brand-200 bg-brand-50 px-1.5 py-0.5 text-[11px] text-brand-800">
                      Constante
                    </span>
                  )}
                  {concerneLabel(activite.concerne) && (
                    <span className="border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-600">
                      {concerneLabel(activite.concerne)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {resumeActivite(activite) ||
                    new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(activite.date))}
                  {activite.echeance
                    ? ` · Échéance ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(activite.echeance))}`
                    : ''}
                  {activite.recurrence === 'constante'
                    ? ''
                    : activite.statut === 'faite'
                      ? ' · Faite'
                      : ' · Planifiée'}
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
                  {activite.recurrence !== 'constante' && activite.statut !== 'faite' && (
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
                    onClick={() => {
                      deleteActivite(departementId, activite.id)
                      retirerRappelActivite(departementId, activite.id)
                    }}
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
        <DialogContent
          title="Modifier l'activité"
          description="Les membres seront de nouveau prévenus après l’enregistrement."
        >
          <form onSubmit={onEdit} className="flex flex-col gap-3">
            <ActiviteFields
              draft={editDraft}
              onChange={setEditDraft}
              membres={membres}
              destinataires={destinataires}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Annuler
              </Button>
              <Button type="submit" disabled={!draftValide(editDraft)}>
                Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
