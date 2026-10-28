import { useMemo, useState, type FormEvent } from 'react'
import { Link, NavLink, Navigate, useLocation } from 'react-router-dom'
import { Pencil, Plus, Search, Shield, Trash2, Crown } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { useAccessScope } from '@/features/auth/accessScope'
import { applicationPageFromPath, useApplicationPageAccess } from '@/features/auth/applicationPageAccess'
import { canSeePilotageDge, isMembreDge } from '@/features/auth/orgRoles'
import { useComptes } from '@/features/comptes/hooks'
import {
  createDemandeCompte,
  findDemandeEnAttente,
  type RoleDemandeCompte,
} from '@/features/notifications/store'
import { cn } from '@/lib/cn'
import { PERMISSIONS } from '@/lib/permissions'
import { useCurrentUser, useHasPermission } from '@/stores/authStore'
import type { AffectationDepartement, Departement, Personne } from '@/types'
import { usePersonnes, usePersonnesAffectations } from '@/features/personnes/hooks'
import { DepartementBanner } from './banner'
import { DepartementFormDialog } from './DepartementFormDialog'
import { defaultSiteId } from './api'
import {
  useAssignPersonneDepartement,
  useCreateDepartement,
  useDeleteDepartement,
  useDepartements,
  useUnassignPersonneDepartement,
  useUpdateDepartement,
} from './hooks'
import { roleDepartement } from './roles'
import { toDepartementCreate, toDepartementUpdate, type DepartementFormValues } from './schema'
import { TableLoading } from './loading'
import { DgeRapportsPanel, DgeSuiviPanel } from './DgeSuiviPanel'

const DGE_VUES = [
  { to: '/departements', label: 'Tous les départements', end: true },
  { to: '/departements/suivi', label: 'Suivi DGE' },
  { to: '/departements/rapports', label: 'Rapports reçus' },
] as const

const PAGE_SIZE = 20

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
}

function personneName(personne: Personne) {
  return `${personne.prenom} ${personne.nom}`
}

export function DepartementsPage() {
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
  const [editingDepartement, setEditingDepartement] = useState<Departement | null>(null)
  const [departementToDelete, setDepartementToDelete] = useState<Departement | null>(null)
  const [chefDepartement, setChefDepartement] = useState<Departement | null>(null)
  const [superviseurDepartement, setSuperviseurDepartement] = useState<Departement | null>(null)
  const [chefSearch, setChefSearch] = useState('')
  const [demandeMessage, setDemandeMessage] = useState<string>()
  const [formSiteError, setFormSiteError] = useState<string>()

  const canCreate = useHasPermission(PERMISSIONS.DEPARTEMENTS_CREATE) || useHasPermission(PERMISSIONS.ROLES_MANAGE)
  const canUpdate = useHasPermission(PERMISSIONS.DEPARTEMENTS_UPDATE)
  const canDelete = useHasPermission(PERMISSIONS.DEPARTEMENTS_DELETE)
  const user = useCurrentUser()
  const { isScoped, isLoading: scopeLoading, ledDepartementIds } = useAccessScope()
  const isDge = isMembreDge(user)
  const voitPilotage = canSeePilotageDge(user)
  const canAssignSuperviseur = isDge || canUpdate
  const canAssignChef = isDge || canUpdate
  const canReadComptes = useHasPermission(PERMISSIONS.COMPTES_READ)
  const canOpenCompte =
    useHasPermission(PERMISSIONS.COMPTES_CREATE) && useHasPermission(PERMISSIONS.ROLES_MANAGE)

  const listParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      q: submittedSearch || undefined,
    }),
    [page, submittedSearch],
  )
  const catalogQuery = useDepartements({ page: 1, limit: 100 })
  const departementsQuery = useDepartements(listParams)
  const personnesQuery = usePersonnes({ page: 1, limit: 100 })
  const comptesQuery = useComptes(
    { page: 1, limit: 100 },
    (canAssignSuperviseur || canAssignChef) && canReadComptes,
  )
  const personnes = personnesQuery.data?.data ?? []
  const personneIds = useMemo(() => personnes.map((personne) => personne.idPersonne), [personnes])
  const affectationQueries = usePersonnesAffectations(personneIds, false)

  const createMutation = useCreateDepartement()
  const updateMutation = useUpdateDepartement()
  const deleteMutation = useDeleteDepartement()
  const assignMutation = useAssignPersonneDepartement()
  const unassignMutation = useUnassignPersonneDepartement()

  const affectations = useMemo(() => {
    const items: AffectationDepartement[] = []
    affectationQueries.forEach((query) => {
      query.data?.forEach((affectation) => items.push(affectation))
    })
    return items
  }, [affectationQueries])
  const affectationsActives = affectations.filter((affectation) => affectation.actif)

  const chefByDepartement = useMemo(() => {
    const map = new Map<string, Personne>()
    affectationsActives.forEach((affectation) => {
      if (roleDepartement(affectation.fonction) !== 'Chef') return
      const personne = personnes.find((item) => item.idPersonne === affectation.idPersonne)
      if (personne) map.set(affectation.idDepartement, personne)
    })
    return map
  }, [affectationsActives, personnes])

  const superviseurByDepartement = useMemo(() => {
    const map = new Map<string, Personne>()
    affectationsActives.forEach((affectation) => {
      if (roleDepartement(affectation.fonction) !== 'Superviseur') return
      const personne = personnes.find((item) => item.idPersonne === affectation.idPersonne)
      if (personne) map.set(affectation.idDepartement, personne)
    })
    return map
  }, [affectationsActives, personnes])

  const scopedIds = useMemo(() => new Set(ledDepartementIds), [ledDepartementIds])
  const departements = (departementsQuery.data?.data ?? []).filter(
    (departement) => !isScoped || scopedIds.has(departement.idDepartement),
  )
  const pagination = departementsQuery.data?.pagination
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1
  const prochesChef = personnes.filter((personne) => {
    const needle = chefSearch.trim().toLowerCase()
    if (!needle) return true
    return personneName(personne).toLowerCase().includes(needle)
  })

  const openCreate = () => {
    setEditingDepartement(null)
    createMutation.reset()
    updateMutation.reset()
    setFormSiteError(undefined)
    setFormOpen(true)
  }

  const openEdit = (departement: Departement) => {
    setEditingDepartement(departement)
    createMutation.reset()
    updateMutation.reset()
    setFormSiteError(undefined)
    setFormOpen(true)
  }

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setPage(1)
    setSubmittedSearch(searchInput.trim())
  }

  const handleFormSubmit = async (values: DepartementFormValues) => {
    const idSite = editingDepartement?.idSite ?? (await defaultSiteId())
    if (!idSite) {
      setFormSiteError("Impossible d'enregistrer le département pour le moment.")
      return
    }
    if (editingDepartement) {
      updateMutation.mutate(
        {
          departementId: editingDepartement.idDepartement,
          payload: toDepartementUpdate(values, idSite),
        },
        { onSuccess: () => setFormOpen(false) },
      )
      return
    }
    createMutation.mutate(toDepartementCreate(values, idSite), {
      onSuccess: () => setFormOpen(false),
    })
  }

  const notifierOuvertureCompte = (
    personne: Personne,
    departement: Departement,
    roleCible: RoleDemandeCompte,
  ) => {
    if (!user || canOpenCompte) return
    const label = roleCible === 'Chef' ? 'chef de département' : 'superviseur'
    const hasCompte = comptesQuery.data?.data.some(
      (compte) => compte.idPersonne === personne.idPersonne,
    )
    if (hasCompte) {
      setDemandeMessage(undefined)
      return
    }
    if (findDemandeEnAttente(personne.idPersonne, departement.idDepartement, roleCible)) {
      setDemandeMessage(
        `Une demande d’ouverture de compte ${label} pour ${personneName(personne)} est déjà en cours.`,
      )
      return
    }
    createDemandeCompte({
      idPersonneCible: personne.idPersonne,
      nomCible: personneName(personne),
      idDepartement: departement.idDepartement,
      nomDepartement: departement.nom,
      idDemandeur: user.personne.idPersonne,
      nomDemandeur: `${user.personne.prenom} ${user.personne.nom}`,
      roleCible,
    })
    setDemandeMessage(
      `Demande envoyée à l’administrateur pour ouvrir le compte ${label} de ${personneName(personne)}. Vous serez prévenu une fois le compte créé.`,
    )
  }

  const applyChef = async (personne: Personne) => {
    if (!chefDepartement) return
    const departementId = chefDepartement.idDepartement
    const currentChef = chefByDepartement.get(departementId)
    const currentRole = affectationsActives.find(
      (affectation) =>
        affectation.idPersonne === personne.idPersonne && affectation.idDepartement === departementId,
    )

    try {
      if (currentChef && currentChef.idPersonne !== personne.idPersonne) {
        await unassignMutation.mutateAsync({ personneId: currentChef.idPersonne, departementId })
        await assignMutation.mutateAsync({
          personneId: currentChef.idPersonne,
          payload: { idDepartement: departementId, fonction: 'Membre' },
        })
      }
      if (currentRole) {
        await unassignMutation.mutateAsync({ personneId: personne.idPersonne, departementId })
      }
      await assignMutation.mutateAsync({
        personneId: personne.idPersonne,
        payload: { idDepartement: departementId, fonction: 'Chef' },
      })
      notifierOuvertureCompte(personne, chefDepartement, 'Chef')
      setChefDepartement(null)
      setChefSearch('')
    } catch {
      /* l'erreur est déjà portée par la mutation */
    }
  }

  const applySuperviseur = async (personne: Personne) => {
    if (!superviseurDepartement || !user) return
    const departementId = superviseurDepartement.idDepartement
    const currentSuperviseur = superviseurByDepartement.get(departementId)
    const currentRole = affectationsActives.find(
      (affectation) =>
        affectation.idPersonne === personne.idPersonne && affectation.idDepartement === departementId,
    )

    try {
      if (currentSuperviseur && currentSuperviseur.idPersonne !== personne.idPersonne) {
        await unassignMutation.mutateAsync({
          personneId: currentSuperviseur.idPersonne,
          departementId,
        })
        await assignMutation.mutateAsync({
          personneId: currentSuperviseur.idPersonne,
          payload: { idDepartement: departementId, fonction: 'Membre' },
        })
      }
      if (currentRole) {
        await unassignMutation.mutateAsync({ personneId: personne.idPersonne, departementId })
      }
      await assignMutation.mutateAsync({
        personneId: personne.idPersonne,
        payload: { idDepartement: departementId, fonction: 'Superviseur' },
      })
      notifierOuvertureCompte(personne, superviseurDepartement, 'Superviseur')
      setSuperviseurDepartement(null)
      setChefSearch('')
    } catch {
      /* l'erreur est déjà portée par la mutation */
    }
  }

  const formError =
    formSiteError ??
    (editingDepartement ? updateMutation.error?.message : createMutation.error?.message)
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const chefBusy = assignMutation.isPending || unassignMutation.isPending

  if (!voitPilotage && vue !== 'tableau') {
    return <Navigate to="/departements" replace />
  }

  const destDge = (catalogQuery.data?.data ?? [])
    .filter((item) => item.actif)
    .map((item) => ({ idDepartement: item.idDepartement, nom: item.nom }))

  return (
    <div className="flex flex-col gap-6">
      <DepartementBanner
        prenom={user?.personne.prenom ?? ''}
        message="Que chaque département serve l'Église avec fidélité."
        action={
          canCreate ? (
            <Button variant="glass" onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              Nouveau département
            </Button>
          ) : undefined
        }
      />

      {voitPilotage && (
        <div>
          <div role="tablist" aria-label="Sections DGE" className="flex flex-wrap gap-6 border-b border-slate-200">
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
                    isActive ? 'border-gerbe-or text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            La DGE pilote les superviseurs, qui accompagnent les chefs de département.
          </p>
        </div>
      )}

      {voitPilotage && vue === 'suivi' && user && (
        <DgeSuiviPanel
          departements={destDge}
          filtreIds={destDge.map((item) => item.idDepartement)}
          auteur={{
            idPersonne: user.personne.idPersonne,
            nom: `${user.personne.prenom} ${user.personne.nom}`,
          }}
        />
      )}

      {voitPilotage && vue === 'rapports' && (
        <DgeRapportsPanel filtreIds={destDge.map((item) => item.idDepartement)} />
      )}

      {vue === 'tableau' && demandeMessage && (
        <Alert variant="success" title="Demande transmise">
          {demandeMessage}
        </Alert>
      )}

      {vue === 'tableau' && (
      <>
      <h2 className="text-lg font-semibold text-slate-900">Départements</h2>

      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row" role="search">
        <div className="relative max-w-sm flex-1">
          <Search
            className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Rechercher un département…"
            aria-label="Rechercher un département"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Rechercher
        </Button>
      </form>

      {departementsQuery.isError && (
        <Alert variant="error" title="Impossible de charger les départements">
          {departementsQuery.error.message}
        </Alert>
      )}

      {(departementsQuery.isLoading || (isScoped && scopeLoading)) && (
        <TableLoading label="Chargement des départements…" />
      )}

      {departementsQuery.isSuccess && !(isScoped && scopeLoading) && departements.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-slate-900">Aucun département</p>
          <p className="mt-1 text-sm text-slate-500">
            {submittedSearch ? 'Aucun résultat pour ces critères.' : "Aucun département n'est encore enregistré."}
          </p>
        </div>
      )}

      {departements.length > 0 && (
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
                {departements.map((departement) => {
                  const chef = chefByDepartement.get(departement.idDepartement)
                  const superviseur = superviseurByDepartement.get(departement.idDepartement)
                  return (
                    <tr key={departement.idDepartement} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{departement.code}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/departements/${departement.idDepartement}`}
                          className="font-medium text-slate-900 hover:text-brand-700"
                        >
                          {departement.nom}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {superviseur ? personneName(superviseur) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{chef ? personneName(chef) : '—'}</td>
                      <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">
                        {formatDate(departement.dateCreation)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            departement.actif
                              ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'
                              : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
                          }
                        >
                          {departement.actif ? 'Actif' : 'Inactif'}
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
                                  setDemandeMessage(undefined)
                                  setChefDepartement(null)
                                  setSuperviseurDepartement(departement)
                                }}
                                aria-label={`Désigner le superviseur de ${departement.nom}`}
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
                                  setSuperviseurDepartement(null)
                                  setChefDepartement(departement)
                                }}
                                aria-label={`Désigner le chef de ${departement.nom}`}
                              >
                                <Crown className="size-4" aria-hidden="true" />
                              </Button>
                            )}
                            {canUpdate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(departement)}
                                aria-label={`Modifier ${departement.nom}`}
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
                                  setDepartementToDelete(departement)
                                }}
                                aria-label={`Supprimer ${departement.nom}`}
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
                {pagination.total} département{pagination.total > 1 ? 's' : ''} · page{' '}
                {pagination.page} / {totalPages}
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

      <DepartementFormDialog
        open={formOpen}
        departement={editingDepartement}
        errorMessage={formError}
        isSubmitting={isSubmitting}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
      />

      <Dialog
        open={Boolean(chefDepartement)}
        onOpenChange={(open) => {
          if (!open) setChefDepartement(null)
        }}
      >
        <DialogContent
          title={chefDepartement ? `Chef de ${chefDepartement.nom}` : 'Chef du département'}
          description="Le DGE désigne le chef. S’il n’a pas encore de compte, une demande part à l’administrateur."
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
                  aria-label={`Désigner ${personneName(personne)} comme chef`}
                  onClick={() => void applyChef(personne)}
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
        open={Boolean(superviseurDepartement)}
        onOpenChange={(open) => {
          if (!open) setSuperviseurDepartement(null)
        }}
      >
        <DialogContent
          title={
            superviseurDepartement
              ? `Superviseur de ${superviseurDepartement.nom}`
              : 'Superviseur du département'
          }
          description="Le DGE désigne le superviseur. S’il n’a pas encore de compte, une demande part à l’administrateur."
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
            aria-label="Rechercher un superviseur"
            className="mb-3"
          />
          <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {prochesChef.map((personne) => (
              <li key={personne.idPersonne}>
                <button
                  type="button"
                  disabled={chefBusy}
                  aria-label={`Désigner ${personneName(personne)} comme superviseur`}
                  onClick={() => void applySuperviseur(personne)}
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
        open={Boolean(departementToDelete)}
        onOpenChange={(open) => !open && setDepartementToDelete(null)}
      >
        <DialogContent
          title="Supprimer ce département ?"
          description="Le contrat n'autorise la suppression que s'il n'est rattaché à aucune personne."
        >
          {deleteMutation.isError && (
            <Alert variant="error" title="Suppression impossible">
              {deleteMutation.error.message}
            </Alert>
          )}
          <p className="text-sm text-slate-600">
            {departementToDelete?.nom} ({departementToDelete?.code}) sera retiré définitivement.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDepartementToDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => {
                if (!departementToDelete) return
                deleteMutation.mutate(departementToDelete.idDepartement, {
                  onSuccess: () => setDepartementToDelete(null),
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
