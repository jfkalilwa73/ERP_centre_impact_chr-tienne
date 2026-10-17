import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, ArrowLeft, Camera, FileDown, Heart, Pencil, Plus, StickyNote, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useComptes } from '@/features/comptes/hooks'
import { useDepartements } from '@/features/departements/hooks'
import { useFamille, useFamilles } from '@/features/familles/hooks'
import { cn } from '@/lib/cn'
import { errorId } from '@/lib/form'
import { PERMISSIONS } from '@/lib/permissions'
import { useHasPermission } from '@/stores/authStore'
import type { AffectationDepartement, Personne } from '@/types'
import { PersonneFormDialog } from './PersonneFormDialog'
import { initials } from './duplicates'
import { activeFamilleId, familleLabel } from './familles'
import {
  FORMATIONS,
  STATUT_CIVIL_LABELS,
  TYPES_LIEN,
  addFicheEvenement,
  addNotePastorale,
  complementFromEdit,
  criteresFiche,
  deleteNotePastorale,
  emptyFicheComplement,
  getFicheComplement,
  listFicheEvenements,
  memberCode,
  removeLienFamilial,
  saveFicheComplement,
  upsertLienFamilial,
  type FicheEvenement,
} from './fiche'
import {
  useAssignDepartement,
  useAssignFamille,
  usePersonne,
  usePersonneAffectations,
  usePersonneFamilles,
  usePersonnes,
  useUnassignDepartement,
  useUnassignFamille,
  useUpdatePersonne,
} from './hooks'
import { ROLES_DEPARTEMENT, roleDepartement } from '@/features/departements/roles'
import { formatDate, formatDateLong, STATUT_LABELS, statutBadgeClass } from './labels'
import { PersonneAvatar } from './PersonneAvatar'
import { readImageAsDataUrl, setPersonnePhoto, usePersonnePhoto } from './photos'
import { exportFichePdf } from './printFiche'
import {
  affectationSchema,
  toPersonneUpdate,
  type AffectationFormValues,
  type PersonneEditFormValues,
} from './schema'

const TABS = [
  { id: 'general', label: 'Informations Générales' },
  { id: 'famille', label: 'Liens Familiaux' },
  { id: 'ministeres', label: 'Responsabilités & Ministères' },
  { id: 'historique', label: 'Historique' },
] as const

type TabId = (typeof TABS)[number]['id']

const LIEN_INVERSE: Record<string, string> = {
  Conjoint: 'Conjoint',
  Frère: 'Frère',
  Sœur: 'Sœur',
  Parent: 'Enfant',
  Enfant: 'Parent',
}

function Card({
  title,
  children,
  action,
  icon,
}: {
  title: string
  children: ReactNode
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value}</p>
    </div>
  )
}

function ProfilePhoto({
  personne,
  canUpdate,
  onImported,
}: {
  personne: Personne
  canUpdate: boolean
  onImported: (dataUrl: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>()

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const dataUrl = await readImageAsDataUrl(file)
      onImported(dataUrl)
      setError(undefined)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d'importer la photo.")
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative size-16">
        <PersonneAvatar
          personne={personne}
          className="size-16 text-lg"
          initialsClassName="bg-slate-900 text-white"
        />
        {canUpdate && (
          <>
            <button
              type="button"
              className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm hover:bg-brand-700"
              aria-label="Importer une photo de profil"
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="size-3.5" aria-hidden="true" />
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-label="Fichier photo de profil"
              className="sr-only"
              onChange={onFile}
            />
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="max-w-40 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

function FicheImpression({
  personne,
  photoSrc,
  email,
  sexeLabel,
  famille,
  complement,
  personnes,
  affectationsActives,
  nomDepartement,
}: {
  personne: Personne
  photoSrc?: string
  email?: string
  sexeLabel: string
  famille?: string
  complement: ReturnType<typeof getFicheComplement>
  personnes: Personne[]
  affectationsActives: AffectationDepartement[]
  nomDepartement: (id: string) => string
}) {
  return (
    <article id="fiche-impression" className="hidden print:block" aria-hidden="true">
      <header className="mb-6 border-b border-slate-200 pb-4">
        <img
          src="/logo-icc.png"
          alt="Impact Centre Chrétien"
          className="mb-4 h-10 w-auto"
        />
        <div className="flex items-center gap-4">
          {photoSrc ? (
            <img src={photoSrc} alt="" className="size-20 rounded-full object-cover" />
          ) : (
            <span className="flex size-20 items-center justify-center rounded-full bg-slate-900 text-xl font-semibold text-white">
              {initials(personne)}
            </span>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {personne.prenom} {personne.nom}
            </h1>
          </div>
        </div>
      </header>

      <section className="mb-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Coordonnées</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Téléphone" value={personne.telephone ?? '—'} />
          <Field label="Email" value={email ?? '—'} />
          <Field label="Adresse Principale" value={personne.adresse ?? '—'} />
        </div>
      </section>

      <section className="mb-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Détails Civils & Ecclésiastiques</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Statut Civil"
            value={complement.statutCivil ? STATUT_CIVIL_LABELS[complement.statutCivil] : '—'}
          />
          <Field
            label="Date de Naissance"
            value={personne.dateNaissance ? formatDateLong(personne.dateNaissance) : '—'}
          />
          <Field label="Date d'Intégration" value={formatDateLong(personne.dateCreation)} />
          <Field label="Compétences / Professions" value={complement.competences || '—'} />
          <Field label="Sexe" value={sexeLabel} />
          <Field label="Famille d'impact" value={famille ?? '—'} />
          <Field label="Certificat de baptême" value={complement.certificatBaptemeNom || '—'} />
          {FORMATIONS.map((formation) => (
            <Field
              key={formation.id}
              label={formation.label}
              value={complement.formations[formation.id] ? 'Obtenue' : '—'}
            />
          ))}
        </div>
      </section>

      <section className="mb-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Liens Familiaux</h2>
        {complement.liens.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun lien familial renseigné.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {complement.liens.map((lien) => {
              const proche = personnes.find((item) => item.idPersonne === lien.idPersonne)
              return (
                <li key={lien.idPersonne} className="text-sm text-slate-900">
                  {proche ? `${proche.prenom} ${proche.nom}` : 'Personne liée'} — {lien.lien}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Responsabilités & Ministères</h2>
        {affectationsActives.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune affectation départementale.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {affectationsActives.map((affectation) => (
              <li key={`${affectation.idDepartement}-${affectation.dateDebut}`} className="text-sm text-slate-900">
                {nomDepartement(affectation.idDepartement)}
                {affectation.fonction ? ` — ${affectation.fonction}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  )
}

export function PersonneDetailPage() {
  const { personneId } = useParams<{ personneId: string }>()
  const [tab, setTab] = useState<TabId>('general')
  const [assignOpen, setAssignOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [complement, setComplement] = useState(emptyFicheComplement)
  const [lienSearch, setLienSearch] = useState('')
  const [historyTick, setHistoryTick] = useState(0)

  const canUpdate = useHasPermission(PERMISSIONS.MEMBRES_UPDATE)
  const canAssignDepartement = canUpdate || useHasPermission(PERMISSIONS.ROLES_MANAGE)
  const canReadDepartements =useHasPermission(PERMISSIONS.DEPARTEMENTS_READ) || useHasPermission(PERMISSIONS.ROLES_MANAGE)
  const canReadFamilles = useHasPermission(PERMISSIONS.FAMILLES_READ)
  const canReadComptes = useHasPermission(PERMISSIONS.COMPTES_READ)

  const personneQuery = usePersonne(personneId)
  const catalogQuery = usePersonnes({ page: 1, limit: 100 })
  const affectationsQuery = usePersonneAffectations(personneId)
  const famillesAffectationsQuery = usePersonneFamilles(personneId)
  const departementsQuery = useDepartements({ page: 1, limit: 100 }, canReadDepartements)
  const famillesQuery = useFamilles({ page: 1, limit: 100 }, canReadFamilles)
  const comptesQuery = useComptes({ page: 1, limit: 100 }, canReadComptes)

  useEffect(() => {
    setComplement(personneId ? getFicheComplement(personneId) : emptyFicheComplement)
  }, [personneId])
  const photoSrc = usePersonnePhoto(personneId ?? '', personneQuery.data?.photoUrl)
  const assignMutation = useAssignDepartement(personneId ?? '')
  const unassignMutation = useUnassignDepartement(personneId ?? '')
  const assignFamilleMutation = useAssignFamille(personneId ?? '')
  const unassignFamilleMutation = useUnassignFamille(personneId ?? '')
  const updateMutation = useUpdatePersonne()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AffectationFormValues>({
    resolver: zodResolver(affectationSchema),
    defaultValues: { idDepartement: '', fonction: 'Membre' },
  })

  const personne = personneQuery.data
  const affectations = affectationsQuery.data ?? []
  const affectationsActives = affectations.filter((affectation) => affectation.actif)
  const departements = departementsQuery.data?.data ?? []
  const famillesImpact = famillesQuery.data?.data ?? []
  const currentFamilleId = activeFamilleId(famillesAffectationsQuery.data)
  const familleQuery = useFamille(currentFamilleId, !famillesImpact.some((item) => item.idFamille === currentFamilleId))
  const famille = famillesImpact.find((item) => item.idFamille === currentFamilleId) ?? familleQuery.data
  const personnes = catalogQuery.data?.data ?? []
  const departementNames = new Map(
    departements.map((departement) => [
      departement.idDepartement,
      `${departement.nom} (${departement.code})`,
    ]),
  )
  const nomDepartement = (id: string) =>
    departementNames.get(id) ?? (canReadDepartements ? 'Département' : id.slice(0, 8))
  const email = useMemo(() => {
    if (!canReadComptes || !personne) return undefined
    return comptesQuery.data?.data.find((compte) => compte.idPersonne === personne.idPersonne)?.email
  }, [canReadComptes, comptesQuery.data?.data, personne])

  const displayedPhoto = photoSrc
  const liens = complement.liens
  const qualite = personne ? criteresFiche({ personne, complement, idFamille: currentFamilleId }) : null

  const historique = useMemo(() => {
    if (!personne) return []
    const events: FicheEvenement[] = [
      {
        id: 'creation',
        date: personne.dateCreation,
        categorie: 'creation',
        libelle: 'Création de la fiche',
      },
      ...liens.map((lien) => {
        const proche = personnes.find((item) => item.idPersonne === lien.idPersonne)
        return {
          id: `lien-${lien.idPersonne}`,
          date: lien.dateAjout,
          categorie: 'lien' as const,
          libelle: `Lien familial ajouté : ${proche ? `${proche.prenom} ${proche.nom}` : 'personne liée'} (${lien.lien})`,
        }
      }),
      ...affectations.flatMap((affectation) => {
        const added: FicheEvenement = {
          id: `resp-${affectation.idDepartement}-${affectation.dateDebut}`,
          date: affectation.dateDebut,
          categorie: 'responsabilite',
          libelle: `Responsabilité ajoutée : ${nomDepartement(affectation.idDepartement)}${
            affectation.fonction ? ` — ${affectation.fonction}` : ''
          }`,
        }
        if (!affectation.dateFin) return [added]
        const removed: FicheEvenement = {
          id: `resp-fin-${affectation.idDepartement}-${affectation.dateFin}`,
          date: affectation.dateFin,
          categorie: 'responsabilite',
          libelle: `Responsabilité retirée : ${nomDepartement(affectation.idDepartement)}`,
        }
        return [added, removed]
      }),
      ...listFicheEvenements(personne.idPersonne),
    ]
    return events.sort((left, right) => right.date.localeCompare(left.date))
    // historyTick force le recalcul après un événement local.
  }, [personne, liens, affectations, personnes, historyTick, nomDepartement])

  const onAssign = handleSubmit((values) => {
    assignMutation.mutate(
      {
        idDepartement: values.idDepartement,
        fonction: values.fonction.trim() || undefined,
      },
      {
        onSuccess: () => {
          setAssignOpen(false)
          reset({ idDepartement: '', fonction: 'Membre' })
        },
      },
    )
  })

  const persistFicheLocale = (values: PersonneEditFormValues) => {
    if (!personne) return
    setComplement(saveFicheComplement(personne.idPersonne, complementFromEdit(values, complement)))
    addFicheEvenement(personne.idPersonne, {
      categorie: 'modification',
      libelle: 'Modification des informations générales',
    })
    setHistoryTick((current) => current + 1)
    setEditOpen(false)
  }

  const syncFamille = (nextId: string | undefined) => {
    const assignNext = () => {
      if (nextId && nextId !== currentFamilleId) {
        assignFamilleMutation.mutate({ idFamille: nextId, fonction: 'Membre' })
      }
    }
    if (currentFamilleId && currentFamilleId !== nextId) {
      unassignFamilleMutation.mutate(currentFamilleId, { onSettled: assignNext })
      return
    }
    assignNext()
  }

  const onEdit = (values: PersonneEditFormValues) => {
    if (!personne) return
    updateMutation.mutate(
      { personneId: personne.idPersonne, payload: toPersonneUpdate(values) },
      {
        onSuccess: () => {
          persistFicheLocale(values)
          syncFamille(values.idFamille || undefined)
        },
      },
    )
  }

  const onPhotoImported = (dataUrl: string) => {
    if (!personne) return
    setPersonnePhoto(personne.idPersonne, dataUrl)
    addFicheEvenement(personne.idPersonne, {
      categorie: 'modification',
      libelle: 'Photo de profil mise à jour',
    })
    setHistoryTick((current) => current + 1)
  }

  const onChangeLien = (idProche: string, typeLien: string) => {
    if (!personne) return
    if (!typeLien) {
      setComplement(removeLienFamilial(personne.idPersonne, idProche))
      removeLienFamilial(idProche, personne.idPersonne)
      setHistoryTick((current) => current + 1)
      return
    }
    setComplement(upsertLienFamilial(personne.idPersonne, { idPersonne: idProche, lien: typeLien }))
    const inverse = LIEN_INVERSE[typeLien]
    if (inverse) {
      upsertLienFamilial(idProche, { idPersonne: personne.idPersonne, lien: inverse })
    }
    setHistoryTick((current) => current + 1)
  }

  if (personneQuery.isLoading) {
    return <p className="text-sm text-slate-500">Chargement de la fiche…</p>
  }

  if (personneQuery.isError || !personne || !qualite) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="error" title="Fiche introuvable">
          {personneQuery.error?.message ?? 'Cette personne n’existe pas.'}
        </Alert>
        <Link to="/personnes" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          Retour aux personnes
        </Link>
      </div>
    )
  }

  const statut = personne.statut ?? 'actif'
  const sexeLabel = personne.sexe === 'M' ? 'Homme' : personne.sexe === 'F' ? 'Femme' : '—'
  const prochesCatalog = personnes.filter((item) => item.idPersonne !== personne.idPersonne)
  const prochesFiltres = prochesCatalog.filter((item) => {
    const needle = lienSearch.trim().toLowerCase()
    if (!needle) return true
    return `${item.prenom} ${item.nom}`.toLowerCase().includes(needle)
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="print:hidden">
        <Link
          to="/personnes"
          aria-label="Retour aux personnes"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Personnes
        </Link>

        <section className="mt-4 border-t-2 border-gerbe-or bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <ProfilePhoto personne={personne} canUpdate={canUpdate} onImported={onPhotoImported} />
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  {personne.prenom} {personne.nom}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>ID: {memberCode(personne)}</span>
                  <span aria-hidden="true">·</span>
                  <span>Membre depuis {formatDateLong(personne.dateCreation)}</span>
                  <span aria-hidden="true">·</span>
                  <span className={statutBadgeClass(statut)}>{STATUT_LABELS[statut]}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {canUpdate && (
                <Button variant="secondary" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Modifier
                </Button>
              )}
              <Button
                onClick={() =>
                  exportFichePdf({
                    personne,
                    photoSrc: displayedPhoto,
                    email,
                    sexeLabel,
                    famille: famille ? familleLabel(famille) : undefined,
                    complement,
                    personnes,
                    affectationsActives,
                    nomDepartement,
                    formatDateLong,
                  })
                }
              >
                <FileDown className="size-4" aria-hidden="true" />
                Exporter PDF
              </Button>
            </div>
          </div>
        </section>

        <div
          role="tablist"
          aria-label="Sections de la fiche"
          className="mt-4 flex flex-wrap gap-6 border-b border-slate-200 px-1"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              id={`fiche-tab-${item.id}`}
              className={cn(
                '-mb-px border-b-2 pb-3 text-sm font-medium',
                tab === item.id
                  ? 'border-gerbe-or text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800',
              )}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'general' && (
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]">
            <div className="flex flex-col gap-4">
              <Card title="Coordonnées">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Téléphone" value={personne.telephone ?? '—'} />
                  <Field label="Email" value={email ?? '—'} />
                  <div className="sm:col-span-2">
                    <Field label="Adresse Principale" value={personne.adresse ?? '—'} />
                  </div>
                </div>
              </Card>

              <Card title="Détails Civils & Ecclésiastiques">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Statut Civil"
                    value={complement.statutCivil ? STATUT_CIVIL_LABELS[complement.statutCivil] : '—'}
                  />
                  <Field
                    label="Date de Naissance"
                    value={personne.dateNaissance ? formatDateLong(personne.dateNaissance) : '—'}
                  />
                  <Field label="Date d'Intégration" value={formatDateLong(personne.dateCreation)} />
                  <Field label="Compétences / Professions" value={complement.competences || '—'} />
                  <Field label="Sexe" value={sexeLabel} />
                  <Field label="Famille d'impact" value={famille ? familleLabel(famille) : '—'} />
                  <Field label="Certificat de baptême" value={complement.certificatBaptemeNom || '—'} />
                  {FORMATIONS.map((formation) => (
                    <Field
                      key={formation.id}
                      label={formation.label}
                      value={complement.formations[formation.id] ? 'Obtenue' : '—'}
                    />
                  ))}
                </div>
              </Card>

              <Card title="Liens Familiaux (Aperçu)">
                {liens.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun lien familial renseigné.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {liens.slice(0, 2).map((lien) => {
                      const proche = personnes.find((item) => item.idPersonne === lien.idPersonne)
                      return (
                        <li key={lien.idPersonne} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Heart className="size-4 text-slate-400" aria-hidden="true" />
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {proche ? `${proche.prenom} ${proche.nom}` : 'Personne liée'}
                              </p>
                              <p className="text-xs text-slate-500">{lien.lien}</p>
                            </div>
                          </div>
                          <Link
                            to={`/personnes/${lien.idPersonne}`}
                            className="text-sm font-medium text-slate-600 hover:text-brand-700"
                          >
                            Voir fiche
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>
            </div>

            <div className="flex flex-col gap-4">
              <Card title="Qualité de la fiche">
                <p className="text-3xl font-semibold text-slate-900">
                  {qualite.completude}%{' '}
                  <span className="text-sm font-normal text-slate-500">complétude</span>
                </p>
                <div
                  className="mt-3 h-1.5 bg-slate-100"
                  role="progressbar"
                  aria-label="Complétude de la fiche"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={qualite.completude}
                >
                  <div
                    className="h-full bg-gerbe-or transition-[width] duration-500"
                    style={{ width: `${qualite.completude}%` }}
                  />
                </div>
                {qualite.manquants.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-slate-500">Données manquantes :</p>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {qualite.manquants.map((item) => (
                        <li key={item.id} className="flex items-start gap-2 text-sm text-red-600">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {canUpdate && (
                  <Button variant="secondary" className="mt-4 w-full" onClick={() => setEditOpen(true)}>
                    Compléter la fiche
                  </Button>
                )}
              </Card>

              <Card
                title="Notes Pastorales"
                icon={<StickyNote className="size-4 text-slate-400" aria-hidden="true" />}
              >
                {complement.notes.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune note pastorale.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {complement.notes.map((note) => (
                      <li key={note.id} className="flex items-start justify-between gap-3">
                        <p className="text-sm text-slate-600 italic">“{note.texte}”</p>
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                            aria-label="Supprimer la note"
                            onClick={() => setComplement(deleteNotePastorale(personne.idPersonne, note.id))}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {canUpdate && (
                  <Button variant="secondary" className="mt-4 w-full" onClick={() => setNoteOpen(true)}>
                    <Plus className="size-4" aria-hidden="true" />
                    Ajouter une note
                  </Button>
                )}
              </Card>
            </div>
          </div>
        )}

        {tab === 'famille' && (
          <div className="mt-4 flex flex-col gap-4">
            <Card title="Personnes existantes">
              <p className="mb-4 text-sm text-slate-500">
                Choisissez un lien dans la liste pour rattacher une personne déjà enregistrée.
              </p>
              <Input
                value={lienSearch}
                onChange={(event) => setLienSearch(event.target.value)}
                placeholder="Rechercher une personne…"
                aria-label="Rechercher une personne à lier"
                className="mb-4 max-w-sm"
              />
              <div className="overflow-x-auto border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium">Identité</th>
                      <th className="px-4 py-3 font-medium">Statut</th>
                      <th className="px-4 py-3 font-medium">Lien familial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prochesFiltres.map((proche) => {
                      const lienActuel = liens.find((lien) => lien.idPersonne === proche.idPersonne)
                      return (
                        <tr key={proche.idPersonne} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3">
                            <Link
                              to={`/personnes/${proche.idPersonne}`}
                              className="font-medium text-slate-900 hover:text-brand-700"
                            >
                              {proche.prenom} {proche.nom}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <span className={statutBadgeClass(proche.statut)}>{STATUT_LABELS[proche.statut ?? 'actif']}</span>
                          </td>
                          <td className="px-4 py-3">
                            {canUpdate ? (
                              <Select
                                aria-label={`Lien familial avec ${proche.prenom} ${proche.nom}`}
                                value={lienActuel?.lien ?? ''}
                                onChange={(event) => onChangeLien(proche.idPersonne, event.target.value)}
                              >
                                <option value="">Aucun</option>
                                {TYPES_LIEN.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </Select>
                            ) : (
                              <span className="text-slate-600">{lienActuel?.lien ?? '—'}</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab === 'ministeres' && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-900">Responsabilités & Ministères</h2>
              {canAssignDepartement && (
                <Button
                  size="sm"
                  onClick={() => {
                    assignMutation.reset()
                    setAssignOpen(true)
                  }}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Affecter
                </Button>
              )}
            </div>

            {affectationsQuery.isError && (
              <Alert variant="error" title="Impossible de charger les affectations">
                {affectationsQuery.error.message}
              </Alert>
            )}

            {affectationsQuery.isSuccess && affectationsActives.length === 0 && (
              <p className="border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
                Aucune affectation départementale.
              </p>
            )}

            {affectationsActives.length > 0 && (
              <div className="overflow-x-auto border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium">Département</th>
                      <th className="px-4 py-3 font-medium">Rôle</th>
                      <th className="px-4 py-3 font-medium">Depuis</th>
                      {canUpdate && <th className="px-4 py-3 text-right font-medium">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {affectationsActives.map((affectation) => (
                      <tr
                        key={`${affectation.idDepartement}-${affectation.dateDebut}`}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {nomDepartement(affectation.idDepartement)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{roleDepartement(affectation.fonction)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(affectation.dateDebut)}</td>
                        {canUpdate && (
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              isLoading={
                                unassignMutation.isPending &&
                                unassignMutation.variables === affectation.idDepartement
                              }
                              onClick={() => unassignMutation.mutate(affectation.idDepartement)}
                            >
                              Retirer
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {unassignMutation.isError && (
              <Alert variant="error" title="Retrait impossible">
                {unassignMutation.error.message}
              </Alert>
            )}
          </div>
        )}

        {tab === 'historique' && (
          <Card title="Historique">
            {historique.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun événement enregistré.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {historique.map((event) => (
                  <li key={event.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-slate-900">{event.libelle}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDateLong(event.date)}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        )}
      </div>

      <FicheImpression
        personne={personne}
        photoSrc={displayedPhoto}
        email={email}
        sexeLabel={sexeLabel}
        famille={famille ? familleLabel(famille) : undefined}
        complement={complement}
        personnes={personnes}
        affectationsActives={affectationsActives}
        nomDepartement={nomDepartement}
      />

      <PersonneFormDialog
        open={editOpen}
        personne={personne}
        personnes={personnes}
        familles={
          famille && !famillesImpact.some((item) => item.idFamille === famille.idFamille)
            ? [...famillesImpact, famille]
            : famillesImpact
        }
        currentFamilleId={currentFamilleId}
        errorMessage={updateMutation.error?.message}
        isSubmitting={updateMutation.isPending}
        onOpenChange={setEditOpen}
        onSubmit={onEdit}
      />

      <Dialog
        open={assignOpen}
        onOpenChange={(open) => {
          setAssignOpen(open)
          if (!open) assignMutation.reset()
        }}
      >
        <DialogContent
          title="Affecter à un département"
          description="Une personne peut être affectée à plusieurs départements. Le retrait d'une responsabilité est disponible dans le tableau."
        >
          <form onSubmit={onAssign} noValidate className="flex flex-col gap-4">
            {assignMutation.isError && (
              <Alert variant="error" title="Affectation impossible">
                {assignMutation.error.message}
              </Alert>
            )}
            <FormField id="affectation-departement" label="Département" error={errors.idDepartement?.message}>
              <Select
                id="affectation-departement"
                hasError={Boolean(errors.idDepartement)}
                aria-describedby={errors.idDepartement ? errorId('affectation-departement') : undefined}
                {...register('idDepartement')}
              >
                <option value="">Choisir un département</option>
                {departements.map((departement) => (
                  <option key={departement.idDepartement} value={departement.idDepartement}>
                    {departement.nom} ({departement.code})
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="affectation-fonction" label="Rôle" error={errors.fonction?.message}>
              <Select
                id="affectation-fonction"
                hasError={Boolean(errors.fonction)}
                aria-describedby={errors.fonction ? errorId('affectation-fonction') : undefined}
                {...register('fonction')}
              >
                {ROLES_DEPARTEMENT.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setAssignOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" isLoading={assignMutation.isPending}>
                Enregistrer l'affectation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent
          title="Ajouter une note pastorale"
          description="Visible uniquement sur cette fiche, en attendant l'API des notes."
        >
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              const texte = noteDraft.trim()
              if (!texte) return
              setComplement(addNotePastorale(personne.idPersonne, texte))
              setNoteDraft('')
              setNoteOpen(false)
            }}
          >
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Note</span>
              <textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                rows={4}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setNoteOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer la note</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
