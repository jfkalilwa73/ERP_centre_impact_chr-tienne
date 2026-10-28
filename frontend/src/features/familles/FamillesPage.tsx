import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, NavLink, useLocation } from 'react-router-dom'
import { Crown, Pencil, Plus, Search, Shield, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { useAccessScope } from '@/features/auth/accessScope'
import { applicationPageFromPath, useApplicationPageAccess } from '@/features/auth/applicationPageAccess'
import { canSeePilotageDge, isMembreDge } from '@/features/auth/orgRoles'
import { DepartementBanner } from '@/features/departements/banner'
import { DgeRapportsPanel, DgeSuiviPanel } from '@/features/departements/DgeSuiviPanel'
import { TableLoading } from '@/features/departements/loading'
import { cn } from '@/lib/cn'
import { PERMISSIONS } from '@/lib/permissions'
import { useCurrentUser, useHasPermission } from '@/stores/authStore'
import type { AffectationFamille, FamilleImpact, Personne } from '@/types'
import { usePersonnes, usePersonnesFamilles } from '@/features/personnes/hooks'
import { FamilleFormDialog } from './FamilleFormDialog'
import {
  useAssignPersonneFamille,
  useCreateFamille,
  useDeleteFamille,
  useFamilles,
  useUnassignPersonneFamille,
  useUpdateFamille,
} from './hooks'
import { roleFamille } from './roles'
import { toFamilleCreate, toFamilleUpdate, type FamilleFormValues } from './schema'

const DGE_VUES = [
  { to: '/familles', label: "Toutes les familles d'impact", end: true },
  { to: '/familles/suivi', label: 'Suivi DGE' },
  { to: '/familles/rapports', label: 'Rapports reçus' },
] as const

const PAGE_SIZE = 20

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
}

function personneName(personne: Personne) {
  return `${personne.prenom} ${personne.nom}`
}

export function FamillesPage() {
  const location = useLocation()
  const applicationPageAccess = useApplicationPageAccess()
  const vue = location.pathname.endsWith('/suivi')
    ? 'suivi'
    : location.pathname.endsWith('/rapports')
      ? 'rapports'
      : 'tableau'
  const [searchInput, setSearchInput] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingFamille, setEditingFamille] = useState<FamilleImpact | null>(null)
  const [familleToDelete, setFamilleToDelete] = useState<FamilleImpact | null>(null)
  const [chefFamille, setChefFamille] = useState<FamilleImpact | null>(null)
  const [superviseurFamille, setSuperviseurFamille] = useState<FamilleImpact | null>(null)
  const [chefSearch, setChefSearch] = useState('')

  const canCreate = useHasPermission(PERMISSIONS.FAMILLES_CREATE)
  const canUpdate = useHasPermission(PERMISSIONS.FAMILLES_UPDATE)
  const canDelete = useHasPermission(PERMISSIONS.FAMILLES_DELETE)
  const user = useCurrentUser()
  const { isScoped, isLoading: scopeLoading, ledFamilleIds } = useAccessScope()
  const isDge = isMembreDge(user)
  const voitPilotage = canSeePilotageDge(user)
  const canAssignSuperviseur = isDge || canUpdate
  const canAssignChef = isDge || canUpdate

  const listParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      q: submittedSearch || undefined,
    }),
    [page, submittedSearch],
  )
  const catalogQuery = useFamilles({ page: 1, limit: 100 })
  const famillesQuery = useFamilles(listParams)
  const personnesQuery = usePersonnes({ page: 1, limit: 100 })
  const personnes = personnesQuery.data?.data ?? []
  const personneIds = useMemo(() => personnes.map((personne) => personne.idPersonne), [personnes])
  const affectationQueries = usePersonnesFamilles(personneIds, false)

  const createMutation = useCreateFamille()
  const updateMutation = useUpdateFamille()
  const deleteMutation = useDeleteFamille()
  const assignMutation = useAssignPersonneFamille()
  const unassignMutation = useUnassignPersonneFamille()

  const affectations = useMemo(() => {
    const items: AffectationFamille[] = []
    affectationQueries.forEach((query) => {
      query.data?.forEach((affectation) => items.push(affectation))
    })
    return items
  }, [affectationQueries])
  const affectationsActives = affectations.filter((affectation) => affectation.actif)

  const chefByFamille = useMemo(() => {
    const map = new Map<string, Personne>()
    affectationsActives.forEach((affectation) => {
      if (roleFamille(affectation.fonction) !== 'Chef') return
      const personne = personnes.find((item) => item.idPersonne === affectation.idPersonne)
      if (personne) map.set(affectation.idFamille, personne)
    })
    return map
  }, [affectationsActives, personnes])

  const superviseurByFamille = useMemo(() => {
    const map = new Map<string, Personne>()
    affectationsActives.forEach((affectation) => {
      if (roleFamille(affectation.fonction) !== 'Superviseur') return
      const personne = personnes.find((item) => item.idPersonne === affectation.idPersonne)
      if (personne) map.set(affectation.idFamille, personne)
    })
    return map
  }, [affectationsActives, personnes])

  const scopedIds = useMemo(() => new Set(ledFamilleIds), [ledFamilleIds])
  const familles = (famillesQuery.data?.data ?? []).filter(
    (famille) => !isScoped || scopedIds.has(famille.idFamille),
  )
  const pagination = famillesQuery.data?.pagination
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1

  const prochesChef = personnes.filter((personne) => {
    const needle = chefSearch.trim().toLowerCase()
    if (!needle) return true
    return personneName(personne).toLowerCase().includes(needle)
  })

  const openCreate = () => {
    setEditingFamille(null)
    createMutation.reset()
    updateMutation.reset()
    setFormOpen(true)
  }

  const openEdit = (famille: FamilleImpact) => {
    setEditingFamille(famille)
    createMutation.reset()
    updateMutation.reset()
    setFormOpen(true)
  }

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setPage(1)
    setSubmittedSearch(searchInput.trim())
  }

  const handleFormSubmit = (values: FamilleFormValues) => {
    if (editingFamille) {
      updateMutation.mutate(
        { familleId: editingFamille.idFamille, payload: toFamilleUpdate(values) },
        { onSuccess: () => setFormOpen(false) },
      )
      return
    }
    createMutation.mutate(toFamilleCreate(values), { onSuccess: () => setFormOpen(false) })
  }

  const closeOtherFamily = async (personneId: string, keepFamilleId: string) => {
    const other = affectationsActives.find(
      (affectation) =>
        affectation.idPersonne === personneId && affectation.idFamille !== keepFamilleId,
    )
    if (other) {
      await unassignMutation.mutateAsync({ personneId, familleId: other.idFamille })
    }
  }

  const applyStructure = async (personne: Personne, role: 'Chef' | 'Superviseur') => {
    const cible = role === 'Chef' ? chefFamille : superviseurFamille
    if (!cible) return
    const familleId = cible.idFamille
    const current =
      role === 'Chef' ? chefByFamille.get(familleId) : superviseurByFamille.get(familleId)
    const currentRole = affectationsActives.find(
      (affectation) =>
        affectation.idPersonne === personne.idPersonne && affectation.idFamille === familleId,
    )

    try {
      if (current && current.idPersonne !== personne.idPersonne) {
        await unassignMutation.mutateAsync({
          personneId: current.idPersonne,
          familleId,
        })
        await assignMutation.mutateAsync({
          personneId: current.idPersonne,
          payload: { idFamille: familleId, fonction: 'Membre' },
        })
      }
      await closeOtherFamily(personne.idPersonne, familleId)
      if (currentRole) {
        await unassignMutation.mutateAsync({ personneId: personne.idPersonne, familleId })
      }
      await assignMutation.mutateAsync({
        personneId: personne.idPersonne,
        payload: { idFamille: familleId, fonction: role },
      })
      setChefFamille(null)
      setSuperviseurFamille(null)
      setChefSearch('')
    } catch {
      /* l'erreur est déjà portée par la mutation */
    }
  }

  const formError = editingFamille ? updateMutation.error?.message : createMutation.error?.message
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const chefBusy = assignMutation.isPending || unassignMutation.isPending
  const designation = chefFamille
    ? { famille: chefFamille, role: 'Chef' as const }
    : superviseurFamille
      ? { famille: superviseurFamille, role: 'Superviseur' as const }
      : null

  if (!voitPilotage && vue !== 'tableau') {
    return <Navigate to="/familles" replace />
  }

  const destDge = (catalogQuery.data?.data ?? [])
    .filter((item) => item.actif)
    .map((item) => ({ idDepartement: item.idFamille, nom: item.nom }))

  return (
    <div className="flex flex-col gap-6">
      <DepartementBanner
        prenom={user?.personne.prenom ?? ''}
        message="Que chaque famille d'impact serve l'Église avec fidélité."
        action={
          canCreate ? (
            <Button variant="glass" onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              Nouvelle famille
            </Button>
          ) : undefined
        }
      />

      {voitPilotage && (
        <div>
          <div
            role="tablist"
            aria-label="Pilotage des familles d'impact"
            className="flex flex-wrap gap-6 border-b border-slate-200"
          >
            {DGE_VUES.filter((item) => {
              const page = applicationPageFromPath(item.to)
              return page !== null && applicationPageAccess.canView(page)
            }).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                role="tab"
                className={({ isActive }) =>
                  cn(
                    '-mb-px border-b-2 pb-3 text-sm font-medium',
                    isActive
                      ? 'border-gerbe-or text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            La DGE pilote les superviseurs, qui accompagnent les chefs de famille.
          </p>
        </div>
      )}

      {voitPilotage && vue === 'suivi' && user && (
        <DgeSuiviPanel
          departements={destDge}
          filtreIds={destDge.map((item) => item.idDepartement)}
          libelleUnite="famille"
          auteur={{
            idPersonne: user.personne.idPersonne,
            nom: `${user.personne.prenom} ${user.personne.nom}`,
          }}
        />
      )}

      {voitPilotage && vue === 'rapports' && (
        <DgeRapportsPanel
          filtreIds={destDge.map((item) => item.idDepartement)}
          libelleUnite="familles d'impact"
        />
      )}

      {vue === 'tableau' && (
        <>
          <h2 className="text-lg font-semibold text-slate-900">Familles d'impact</h2>

          <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row" role="search">
            <div className="relative max-w-sm flex-1">
              <Search
                className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-400"
                aria-hidden="true"
              />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Rechercher une famille…"
                aria-label="Rechercher une famille"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">
              Rechercher
            </Button>
          </form>

          {famillesQuery.isError && (
            <Alert variant="error" title="Impossible de charger les familles">
              {famillesQuery.error.message}
            </Alert>
          )}

          {(famillesQuery.isLoading || (isScoped && scopeLoading)) && (
            <TableLoading label="Chargement des familles…" />
          )}

          {famillesQuery.isSuccess && !(isScoped && scopeLoading) && familles.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="font-medium text-slate-900">Aucune famille</p>
              <p className="mt-1 text-sm text-slate-500">
                {submittedSearch
                  ? 'Aucun résultat pour ces critères.'
                  : "Aucune famille d'impact n'est encore enregistrée."}
              </p>
            </div>
          )}

          {familles.length > 0 && (
            <>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium">Code</th>
                      <th className="px-4 py-3 font-medium">Nom</th>
                      <th className="px-4 py-3 font-medium">Superviseur</th>
                      <th className="px-4 py-3 font-medium">Chef</th>
                      <th className="hidden px-4 py-3 font-medium lg:table-cell">Créé le</th>
                      <th className="px-4 py-3 font-medium">Statut</th>
                      {(canUpdate || canDelete || canAssignSuperviseur || canAssignChef) && (
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {familles.map((famille) => {
                      const chef = chefByFamille.get(famille.idFamille)
                      const superviseur = superviseurByFamille.get(famille.idFamille)
                      return (
                        <tr key={famille.idFamille} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{famille.code}</td>
                          <td className="px-4 py-3">
                            <Link
                              to={`/familles/${famille.idFamille}`}
                              className="font-medium text-slate-900 hover:text-brand-700"
                            >
                              {famille.nom}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {superviseur ? personneName(superviseur) : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{chef ? personneName(chef) : '—'}</td>
                          <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">
                            {formatDate(famille.dateCreation)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                famille.actif
                                  ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'
                                  : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
                              }
                            >
                              {famille.actif ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          {(canUpdate || canDelete || canAssignSuperviseur || canAssignChef) && (
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                {canAssignSuperviseur && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      assignMutation.reset()
                                      unassignMutation.reset()
                                      setChefSearch('')
                                      setChefFamille(null)
                                      setSuperviseurFamille(famille)
                                    }}
                                    aria-label={`Désigner le superviseur de ${famille.nom}`}
                                  >
                                    <Shield className="size-4" aria-hidden="true" />
                                  </Button>
                                )}
                                {canAssignChef && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      assignMutation.reset()
                                      unassignMutation.reset()
                                      setChefSearch('')
                                      setSuperviseurFamille(null)
                                      setChefFamille(famille)
                                    }}
                                    aria-label={`Désigner le chef de ${famille.nom}`}
                                  >
                                    <Crown className="size-4" aria-hidden="true" />
                                  </Button>
                                )}
                                {canUpdate && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEdit(famille)}
                                    aria-label={`Modifier ${famille.nom}`}
                                  >
                                    <Pencil className="size-4" aria-hidden="true" />
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      deleteMutation.reset()
                                      setFamilleToDelete(famille)
                                    }}
                                    aria-label={`Supprimer ${famille.nom}`}
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  >
                                    <Trash2 className="size-4" aria-hidden="true" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.total > PAGE_SIZE && (
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <p>
                    {pagination.total} famille{pagination.total > 1 ? 's' : ''} · page {pagination.page} /{' '}
                    {totalPages}
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
        </>
      )}

      <FamilleFormDialog
        open={formOpen}
        famille={editingFamille}
        errorMessage={formError}
        personnes={personnes}
        isSubmitting={isSubmitting}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
      />

      <Dialog
        open={Boolean(designation)}
        onOpenChange={(open) => {
          if (!open) {
            setChefFamille(null)
            setSuperviseurFamille(null)
          }
        }}
      >
        <DialogContent
          title={
            designation
              ? `${designation.role} de ${designation.famille.nom}`
              : 'Responsable de la famille'
          }
          description={
            designation?.role === 'Superviseur'
              ? 'Recherchez une personne déjà enregistrée pour la désigner comme superviseur.'
              : 'Recherchez une personne déjà enregistrée pour la désigner comme chef.'
          }
        >
          {(assignMutation.isError || unassignMutation.isError) && (
            <Alert variant="error" title="Désignation impossible">
              {assignMutation.error?.message ?? unassignMutation.error?.message}
            </Alert>
          )}
          <Input
            value={chefSearch}
            onChange={(event) => setChefSearch(event.target.value)}
            placeholder="Rechercher une personne…"
            aria-label="Rechercher une personne"
            className="mb-3"
          />
          <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {prochesChef.map((personne) => (
              <li key={personne.idPersonne}>
                <button
                  type="button"
                  disabled={chefBusy}
                  aria-label={`Désigner ${personneName(personne)}`}
                  onClick={() => void applyStructure(personne, designation?.role ?? 'Chef')}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">{personneName(personne)}</span>
                  <span className="text-xs text-slate-500">{personne.telephone ?? ''}</span>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(familleToDelete)}
        onOpenChange={(open) => !open && setFamilleToDelete(null)}
      >
        <DialogContent
          title="Supprimer cette famille ?"
          description="La suppression n'est possible que s'il n'y a plus de membres actifs."
        >
          {deleteMutation.isError && (
            <Alert variant="error" title="Suppression impossible">
              {deleteMutation.error.message}
            </Alert>
          )}
          <p className="text-sm text-slate-600">
            {familleToDelete?.nom} ({familleToDelete?.code}) sera retirée définitivement.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setFamilleToDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => {
                if (!familleToDelete) return
                deleteMutation.mutate(familleToDelete.idFamille, {
                  onSuccess: () => setFamilleToDelete(null),
                })
              }}
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
