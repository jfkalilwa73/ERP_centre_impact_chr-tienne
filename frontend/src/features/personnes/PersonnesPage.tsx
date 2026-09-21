import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, BadgeCheck, ChartColumn, Eye, Plus, Search, UserPlus, Users } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useDepartements } from '@/features/departements/hooks'
import { cn } from '@/lib/cn'
import { PERMISSIONS } from '@/lib/permissions'
import { useHasPermission } from '@/stores/authStore'
import { PersonneFormDialog } from './PersonneFormDialog'
import {
  countDuplicateProfiles,
  duplicateReasonLabels,
  findDuplicateGroups,
  isThisMonth,
  matchesPersonneSearch,
} from './duplicates'
import { familleLabel, famillesImpact, getFamilleForPersonne } from './familles'
import { useCreatePersonne, usePersonnes, usePersonnesAffectations } from './hooks'
import { STATUT_LABELS, statutBadgeClass } from './labels'
import { PersonneAvatar } from './PersonneAvatar'
import { toPersonneCreate, type PersonneEditFormValues } from './schema'

const PAGE_SIZE = 20
const CATALOG_LIMIT = 100

function formatStat(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value)
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = false,
}: {
  label: string
  value: number
  hint: string
  icon: typeof Users
  accent?: boolean
}) {
  return (
    <section
      className={cn(
        'rounded-none px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]',
        accent
          ? 'bg-brand-500 text-white'
          : 'border border-slate-100 bg-white',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={cn('text-sm', accent ? 'text-white/80' : 'text-slate-500')}>{label}</p>
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center',
            accent ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-400',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className={cn('mt-3 text-3xl font-semibold tracking-tight', accent ? 'text-white' : 'text-slate-900')}>
        {formatStat(value)}
      </p>
      <p className={cn('mt-3 text-sm', accent ? 'text-white/80' : 'text-emerald-600')}>{hint}</p>
    </section>
  )
}

function QualityCard({ value }: { value: number }) {
  return (
    <section className="rounded-none border border-slate-100 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-500">Qualité des Données</p>
        <span className="flex size-8 shrink-0 items-center justify-center bg-slate-50 text-slate-400">
          <ChartColumn className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}%</p>
      <div
        className="mt-5 h-1.5 bg-slate-100"
        role="progressbar"
        aria-label="Qualité des données"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div
          className="h-full bg-brand-500 transition-[width] duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </section>
  )
}

export function PersonnesPage() {
  const [searchInput, setSearchInput] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [departementFilter, setDepartementFilter] = useState('')
  const [familleFilter, setFamilleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [duplicatesOpen, setDuplicatesOpen] = useState(false)

  const canCreate = useHasPermission(PERMISSIONS.MEMBRES_CREATE)
  const canReadDepartements = useHasPermission(PERMISSIONS.DEPARTEMENTS_READ)

  const catalogQuery = usePersonnes({ page: 1, limit: CATALOG_LIMIT })
  const departementsQuery = useDepartements({ page: 1, limit: 100 }, canReadDepartements)
  const createMutation = useCreatePersonne()

  const catalog = catalogQuery.data?.data ?? []
  const personneIds = useMemo(() => catalog.map((personne) => personne.idPersonne), [catalog])
  const affectationQueries = usePersonnesAffectations(personneIds)
  const departements = departementsQuery.data?.data ?? []
  const departementNames = useMemo(
    () => new Map(departements.map((departement) => [departement.idDepartement, departement.nom])),
    [departements],
  )
  const departementByPersonne = useMemo(() => {
    const map = new Map<string, { id: string; nom: string }>()
    affectationQueries.forEach((query, index) => {
      const personneId = personneIds[index]
      const active = query.data?.find((affectation) => affectation.actif)
      if (personneId && active) {
        map.set(personneId, {
          id: active.idDepartement,
          nom: departementNames.get(active.idDepartement) ?? 'Département',
        })
      }
    })
    return map
  }, [affectationQueries, departementNames, personneIds])

  const stats = useMemo(() => {
    const total = catalogQuery.data?.pagination.total ?? catalog.length
    const actifs = catalog.filter((personne) => (personne.statut ?? 'actif') === 'actif').length
    const nouvelles = catalog.filter((personne) => isThisMonth(personne.dateCreation)).length
    return {
      total,
      actifs,
      nouvelles,
      partActifs: total === 0 ? 0 : Math.round((actifs / total) * 100),
    }
  }, [catalog, catalogQuery.data?.pagination.total])

  const duplicateGroups = useMemo(() => findDuplicateGroups(catalog), [catalog])
  const duplicateCount = countDuplicateProfiles(duplicateGroups)
  const dataQuality =
    stats.total === 0 ? 100 : Math.round(((stats.total - duplicateCount) / stats.total) * 100)
  const duplicateIds = useMemo(
    () => new Set(duplicateGroups.flatMap((group) => group.personnes.map((item) => item.idPersonne))),
    [duplicateGroups],
  )

  const filtered = useMemo(() => {
    return catalog.filter((personne) => {
      if (!matchesPersonneSearch(personne, submittedSearch)) return false
      if (statutFilter && (personne.statut ?? 'actif') !== statutFilter) return false
      if (departementFilter && departementByPersonne.get(personne.idPersonne)?.id !== departementFilter) {
        return false
      }
      if (familleFilter && getFamilleForPersonne(personne.idPersonne)?.idFamille !== familleFilter) {
        return false
      }
      return true
    })
  }, [catalog, departementByPersonne, departementFilter, familleFilter, statutFilter, submittedSearch])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const personnes = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetPage = () => setPage(1)

  const openCreate = () => {
    createMutation.reset()
    setFormOpen(true)
  }

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    resetPage()
    setSubmittedSearch(searchInput.trim())
  }

  const handleFormSubmit = (values: PersonneEditFormValues) => {
    createMutation.mutate(toPersonneCreate(values), { onSuccess: () => setFormOpen(false) })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900">Personnes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Identités physiques de l'Église, distinctes des comptes de connexion.
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="shrink-0">
            <Plus className="size-4" aria-hidden="true" />
            Nouvelle personne
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Personnes"
          value={stats.total}
          hint={`+${stats.nouvelles} ce mois`}
          icon={Users}
          accent
        />
        <StatCard
          label="Membres Actifs"
          value={stats.actifs}
          hint={`${stats.partActifs}% de la base`}
          icon={BadgeCheck}
        />
        <StatCard
          label="Nouvelles Inscriptions (Mois)"
          value={stats.nouvelles}
          hint={stats.nouvelles > 0 ? 'En hausse' : 'Stable ce mois'}
          icon={UserPlus}
        />
        <QualityCard value={dataQuality} />
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-2 lg:flex-row lg:flex-wrap" role="search">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Rechercher une personne…"
            aria-label="Rechercher une personne"
            className="pl-9"
          />
        </div>
        <Select
          value={statutFilter}
          onChange={(event) => {
            resetPage()
            setStatutFilter(event.target.value)
          }}
          aria-label="Filtrer par statut"
          className="lg:max-w-[12rem]"
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
          <option value="archive">Archivé</option>
        </Select>
        {canReadDepartements && (
          <Select
            value={departementFilter}
            onChange={(event) => {
              resetPage()
              setDepartementFilter(event.target.value)
            }}
            aria-label="Filtrer par département"
            className="lg:max-w-[16rem]"
          >
            <option value="">Tous les départements</option>
            {departements.map((departement) => (
              <option key={departement.idDepartement} value={departement.idDepartement}>
                {departement.nom}
              </option>
            ))}
          </Select>
        )}
        <Select
          value={familleFilter}
          onChange={(event) => {
            resetPage()
            setFamilleFilter(event.target.value)
          }}
          aria-label="Filtrer par famille d'impact"
          className="lg:max-w-[16rem]"
        >
          <option value="">Toutes les familles d'impact</option>
          {famillesImpact.map((famille) => (
            <option key={famille.idFamille} value={famille.idFamille}>
              {familleLabel(famille)}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          Rechercher
        </Button>
      </form>

      {catalogQuery.isError && (
        <Alert variant="error" title="Impossible de charger les personnes">
          {catalogQuery.error.message}
        </Alert>
      )}

      {catalogQuery.isLoading && <p className="text-sm text-slate-500">Chargement des personnes…</p>}

      {catalogQuery.isSuccess && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-slate-900">Aucune personne</p>
          <p className="mt-1 text-sm text-slate-500">
            {submittedSearch || statutFilter || departementFilter || familleFilter
              ? 'Aucun résultat pour ces critères.'
              : "Aucune personne n'est encore enregistrée."}
          </p>
        </div>
      )}

      {personnes.length > 0 && (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {duplicateCount > 0 && (
              <div
                role="status"
                className="flex items-center justify-between gap-4 border-b border-amber-100 bg-amber-50/80 px-4 py-2.5"
              >
                <p className="flex items-center gap-2 text-sm text-amber-900">
                  <AlertTriangle className="size-4 shrink-0 text-amber-500" aria-hidden="true" />
                  <span>
                    {duplicateCount > 1
                      ? `Détection de doublons : ${duplicateCount} profils potentiellement dupliqués nécessitent une révision.`
                      : 'Détection de doublons : 1 profil potentiellement dupliqué nécessite une révision.'}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setDuplicatesOpen(true)}
                  className="shrink-0 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Voir les doublons
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Identité</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Famille d'impact</th>
                  <th className="px-4 py-3 font-medium">Département</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {personnes.map((personne) => {
                  const statut = personne.statut ?? 'actif'
                  const famille = getFamilleForPersonne(personne.idPersonne)
                  return (
                    <tr key={personne.idPersonne} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <PersonneAvatar
                            personne={personne}
                            className="size-9 text-xs"
                            initialsClassName="bg-brand-50 text-brand-700"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/personnes/${personne.idPersonne}`}
                              className="font-medium text-slate-900 hover:text-brand-700"
                            >
                              {personne.prenom} {personne.nom}
                            </Link>
                            <p className="text-xs text-slate-500">{personne.telephone ?? '—'}</p>
                            {duplicateIds.has(personne.idPersonne) && (
                              <p className="mt-0.5 text-xs font-medium text-amber-700">À vérifier</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={statutBadgeClass(statut)}>{STATUT_LABELS[statut]}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {famille ? familleLabel(famille) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {departementByPersonne.get(personne.idPersonne)?.nom ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Link
                            to={`/personnes/${personne.idPersonne}`}
                            aria-label={`Voir la fiche de ${personne.prenom} ${personne.nom}`}
                            className="inline-flex h-8 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-brand-700"
                          >
                            <Eye className="size-4" aria-hidden="true" />
                            <span className="hidden sm:inline">Voir la fiche</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <p>
                {filtered.length} personne{filtered.length > 1 ? 's' : ''} · page {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Précédent
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <PersonneFormDialog
        open={formOpen}
        personne={null}
        errorMessage={createMutation.error?.message}
        isSubmitting={createMutation.isPending}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
      />

      <Dialog open={duplicatesOpen} onOpenChange={setDuplicatesOpen}>
        <DialogContent
          title="Profils à vérifier"
          description="Ces fiches partagent le même nom et prénom, ou le même numéro de téléphone. Ouvrez-les pour décider s'il s'agit de la même personne."
          className="max-w-xl"
        >
          <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
            {duplicateGroups.map((group) => (
              <section key={group.id} className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                <p className="text-xs font-semibold tracking-wide text-amber-800 uppercase">
                  {group.reasons.map((reason) => duplicateReasonLabels[reason]).join(' · ')}
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                  {group.personnes.map((personne) => (
                    <li key={personne.idPersonne} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {personne.prenom} {personne.nom}
                        </p>
                        <p className="text-xs text-slate-500">{personne.telephone ?? 'Sans téléphone'}</p>
                      </div>
                      <Link
                        to={`/personnes/${personne.idPersonne}`}
                        className="text-sm font-medium text-brand-700 hover:text-brand-800"
                        onClick={() => setDuplicatesOpen(false)}
                      >
                        Voir la fiche
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
