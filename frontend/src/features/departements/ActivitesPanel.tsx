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
  besoinCompteRendu,
  concerneLabel,
  deleteActivite,
  enregistrerCompteRendu,
  resumeActivite,
  updateActivite,
  type Activite,
  type ActiviteConcerne,
  type ActiviteModalite,
  type ActiviteRecurrence,
  type PresenceMembre,
} from './activites'
import {
  CAISSE_EGLISE,
  demanderDepense,
  formatMontant,
  syntheseBudget,
  type SourceCaisse,
} from './budget'
import { personneName } from './personneName'

export type UnitePilotage = 'departement' | 'famille'

export type ActivitesStoreApi = {
  add: typeof addActivite
  update: typeof updateActivite
  remove: typeof deleteActivite
  enregistrerCompteRendu: typeof enregistrerCompteRendu
}

const defaultStore: ActivitesStoreApi = {
  add: addActivite,
  update: updateActivite,
  remove: deleteActivite,
  enregistrerCompteRendu,
}

type ActivitesPanelProps = {
  departementId: string
  nomDepartement: string
  activites: Activite[]
  membres: Personne[]
  canWrite: boolean
  auteur?: { idPersonne: string; nom: string }
  store?: ActivitesStoreApi
  unite?: UnitePilotage
}

function labelsUnite(unite: UnitePilotage) {
  if (unite === 'famille') {
    return {
      concerneTous: 'Toute la famille',
      caisse: 'Caisse de la famille',
      intro:
        'L’activité reste dans cette famille. Seuls ses membres sont prévenus. À l’échéance, le responsable assigne un compte rendu (présences et déroulement).',
      empty: 'Aucune activité pour cette famille.',
      edit: 'Les membres de cette famille seront de nouveau prévenus.',
      budgetHint: 'Le montant sera pris sur la caisse de cette famille.',
    }
  }
  return {
    concerneTous: 'Tout le département',
    caisse: 'Caisse du département',
    intro:
      'L’activité reste dans ce département. Seuls ses membres sont prévenus. À l’échéance, le responsable assigne un compte rendu (présences et déroulement).',
    empty: 'Aucune activité pour ce département.',
    edit: 'Les membres de ce département seront de nouveau prévenus.',
    budgetHint: 'Le montant sera pris sur la caisse de ce département.',
  }
}

type Draft = {
  titre: string
  date: string
  echeance: string
  idResponsable: string
  description: string
  concerne: ActiviteConcerne
  recurrence: ActiviteRecurrence
  jours: number[]
  heure: string
  modalite: ActiviteModalite | ''
  besoinBudget: boolean
  montantBudget: string
  sourceBudget: SourceCaisse
}

const emptyDraft = (): Draft => ({
  titre: '',
  date: '',
  echeance: '',
  idResponsable: '',
  description: '',
  concerne: 'equipe',
  recurrence: 'unique',
  jours: [],
  heure: '',
  modalite: '',
  besoinBudget: false,
  montantBudget: '',
  sourceBudget: 'departement',
})

function responsableName(membres: Personne[], id: string) {
  const found = membres.find((personne) => personne.idPersonne === id)
  return found ? personneName(found) : ''
}

function toggleJour(jours: number[], jour: number) {
  return jours.includes(jour) ? jours.filter((item) => item !== jour) : [...jours, jour]
}

function montantBudget(draft: Draft) {
  if (!draft.besoinBudget) return undefined
  const value = Number(draft.montantBudget.replace(',', '.'))
  return Number.isFinite(value) && value > 0 ? value : undefined
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
    sourceBudget: draft.besoinBudget ? draft.sourceBudget : undefined,
    montantBudget: montantBudget(draft),
  }
}

function draftFromActivite(activite: Activite): Draft {
  return {
    titre: activite.titre,
    date: activite.date,
    echeance: activite.echeance ?? '',
    idResponsable: activite.idResponsable ?? '',
    description: activite.description,
    concerne: activite.concerne ?? 'equipe',
    recurrence: activite.recurrence ?? 'unique',
    jours: activite.jours ?? [],
    heure: activite.heure ?? '',
    modalite: activite.modalite ?? '',
    besoinBudget: Boolean(activite.montantBudget),
    montantBudget: activite.montantBudget ? String(activite.montantBudget) : '',
    sourceBudget: activite.sourceBudget ?? 'departement',
  }
}

function draftValide(draft: Draft) {
  if (!draft.titre.trim() || !draft.date) return false
  if (draft.recurrence === 'constante' && (!draft.jours.length || !draft.heure)) return false
  if (draft.besoinBudget && !montantBudget(draft)) return false
  return true
}

function enregistrerBudgetActivite(input: {
  activite: Activite
  departementId: string
  nomDepartement: string
  auteur: { idPersonne: string; nom: string }
}) {
  const montant = input.activite.montantBudget
  const source = input.activite.sourceBudget
  if (!montant || !source) return
  demanderDepense(input.departementId, {
    motif: `Activité : ${input.activite.titre}`,
    montant,
    source,
    idActivite: input.activite.id,
  })
  if (source === 'eglise') {
    createCirculation({
      kind: 'budget',
      titre: `Budget pour ${input.activite.titre}`,
      description: `${formatMontant(montant)} demandés par ${input.nomDepartement} pour cette activité.`,
      idDepartementSource: input.departementId,
      nomDepartementSource: input.nomDepartement,
      idDepartementCible: CAISSE_EGLISE.idDepartement,
      nomDepartementCible: CAISSE_EGLISE.nom,
      idAuteur: input.auteur.idPersonne,
      nomAuteur: input.auteur.nom,
    })
  }
}

function ActiviteFields({
  draft,
  onChange,
  membres,
  disponible,
  labels,
}: {
  draft: Draft
  onChange: (next: Draft) => void
  membres: Personne[]
  disponible: number
  labels: ReturnType<typeof labelsUnite>
}) {
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch })
  const concernes = CONCERNES.map((item) =>
    item.value === 'tous' ? { ...item, label: labels.concerneTous } : item,
  )

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
        {concernes.map((item) => (
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
        className="sm:col-span-2"
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
        className="sm:col-span-2"
      />
      <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
        <input
          type="checkbox"
          checked={draft.besoinBudget}
          aria-label="Cette activité nécessite un budget"
          onChange={(event) => set({ besoinBudget: event.target.checked })}
        />
        Cette activité nécessite un budget
      </label>
      {draft.besoinBudget && (
        <>
          <Input
            type="number"
            min="1"
            step="0.01"
            value={draft.montantBudget}
            onChange={(event) => set({ montantBudget: event.target.value })}
            placeholder="Montant"
            aria-label="Montant du budget de l'activité"
          />
          <Select
            aria-label="Source du budget"
            value={draft.sourceBudget}
            onChange={(event) => set({ sourceBudget: event.target.value as SourceCaisse })}
          >
            <option value="departement">
              {labels.caisse} ({formatMontant(disponible)})
            </option>
            <option value="eglise">{CAISSE_EGLISE.nom}</option>
          </Select>
          <p className="text-xs text-slate-500 sm:col-span-2">
            {draft.sourceBudget === 'eglise'
              ? 'Une demande sera envoyée à la caisse principale de l’Église.'
              : labels.budgetHint}
          </p>
        </>
      )}
    </div>
  )
}

export function ActivitesPanel({
  departementId,
  nomDepartement,
  activites,
  membres,
  canWrite,
  auteur,
  store = defaultStore,
  unite = 'departement',
}: ActivitesPanelProps) {
  const labels = labelsUnite(unite)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [editing, setEditing] = useState<Activite | null>(null)
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft)
  const [rendu, setRendu] = useState<Activite | null>(null)
  const [presence, setPresence] = useState<PresenceMembre[]>([])
  const [deroulement, setDeroulement] = useState('')
  const membreIds = membres.map((personne) => personne.idPersonne)
  const disponible = syntheseBudget(departementId).disponible

  const onAdd = (event: FormEvent) => {
    event.preventDefault()
    if (!draftValide(draft) || !auteur) return
    const created = store.add(departementId, toActiviteFields(draft, membres))
    if (!created) return
    notifyMembresActivite({
      activite: created,
      departementId,
      nomDepartement,
      membreIds,
      auteur,
    })
    enregistrerBudgetActivite({
      activite: created,
      departementId,
      nomDepartement,
      auteur,
    })
    setDraft(emptyDraft())
  }

  const openEdit = (activite: Activite) => {
    setEditing(activite)
    setEditDraft(draftFromActivite(activite))
  }

  const onEdit = (event: FormEvent) => {
    event.preventDefault()
    if (!editing || !draftValide(editDraft) || !auteur) return
    const updated = store.update(departementId, editing.id, toActiviteFields(editDraft, membres))
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

  const openRendu = (activite: Activite) => {
    setRendu(activite)
    setPresence(
      membres.map((personne) => ({
        idPersonne: personne.idPersonne,
        nom: personneName(personne),
        present: true,
      })),
    )
    setDeroulement('')
  }

  const onRendu = (event: FormEvent) => {
    event.preventDefault()
    if (!rendu || !deroulement.trim()) return
    store.enregistrerCompteRendu(departementId, rendu.id, {
      presence,
      deroulement,
      date: new Date().toISOString().slice(0, 10),
    })
    setRendu(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {canWrite && (
        <form onSubmit={onAdd} className="border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Nouvelle activité</h2>
          <p className="mt-1 text-xs text-slate-500">{labels.intro}</p>
          <div className="mt-4">
            <ActiviteFields
              draft={draft}
              onChange={setDraft}
              membres={membres}
              disponible={disponible}
              labels={labels}
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
          {labels.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {activites.map((activite) => {
            const aRendre = besoinCompteRendu(activite)
            const peutRendre =
              aRendre &&
              Boolean(auteur && (canWrite || activite.idResponsable === auteur.idPersonne))
            return (
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
                    {(activite.concerne === 'tous'
                      ? labels.concerneTous
                      : concerneLabel(activite.concerne)) && (
                      <span className="border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-600">
                        {activite.concerne === 'tous'
                          ? labels.concerneTous
                          : concerneLabel(activite.concerne)}
                      </span>
                    )}
                    {aRendre && (
                      <span className="border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-800">
                        Compte rendu attendu
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
                    {activite.montantBudget
                      ? ` · ${formatMontant(activite.montantBudget)} · ${
                          activite.sourceBudget === 'eglise'
                            ? CAISSE_EGLISE.nom
                            : labels.caisse
                        }`
                      : ''}
                  </p>
                  {activite.description && (
                    <p className="mt-1 text-sm text-slate-600">{activite.description}</p>
                  )}
                  {activite.compteRendu && (
                    <div className="mt-2 text-sm text-slate-600">
                      <p>
                        Présents :{' '}
                        {activite.compteRendu.presence
                          .filter((ligne) => ligne.present)
                          .map((ligne) => ligne.nom)
                          .join(', ') || 'aucun'}
                      </p>
                      <p className="mt-1">{activite.compteRendu.deroulement}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {peutRendre && (
                    <Button variant="secondary" size="sm" onClick={() => openRendu(activite)}>
                      Compte rendu
                    </Button>
                  )}
                  {canWrite && (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => openEdit(activite)}>
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        aria-label="Supprimer l'activité"
                        onClick={() => {
                          store.remove(departementId, activite.id)
                          retirerRappelActivite(departementId, activite.id)
                        }}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent
          title="Modifier l'activité"
          description={labels.edit}
        >
          <form onSubmit={onEdit} className="flex flex-col gap-3">
            <ActiviteFields
              draft={editDraft}
              onChange={setEditDraft}
              membres={membres}
              disponible={disponible}
              labels={labels}
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

      <Dialog open={Boolean(rendu)} onOpenChange={(open) => !open && setRendu(null)}>
        <DialogContent
          title="Compte rendu de l'activité"
          description="Liste de présence et courte description du déroulement."
        >
          <form onSubmit={onRendu} className="flex flex-col gap-3">
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-900">Présences</legend>
              <ul className="flex flex-col gap-2">
                {presence.map((ligne) => (
                  <li key={ligne.idPersonne}>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={ligne.present}
                        aria-label={`Présence de ${ligne.nom}`}
                        onChange={(event) =>
                          setPresence((current) =>
                            current.map((item) =>
                              item.idPersonne === ligne.idPersonne
                                ? { ...item, present: event.target.checked }
                                : item,
                            ),
                          )
                        }
                      />
                      {ligne.nom}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
            <textarea
              value={deroulement}
              onChange={(event) => setDeroulement(event.target.value)}
              aria-label="Déroulement de l'activité"
              rows={4}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs"
              placeholder="Comment s’est déroulée l’activité ?"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setRendu(null)}>
                Annuler
              </Button>
              <Button type="submit" disabled={!deroulement.trim()}>
                Enregistrer le compte rendu
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
