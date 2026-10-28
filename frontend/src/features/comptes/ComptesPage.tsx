import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { ChargementCentre } from '@/components/ui/Chargement'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
  useAssignPersonneDepartement,
  useUnassignPersonneDepartement,
} from '@/features/departements/hooks'
import { listPersonneDepartements } from '@/features/personnes/api'
import { usePersonnes } from '@/features/personnes/hooks'
import { useRoles } from '@/features/roles/hooks'
import { PERMISSIONS } from '@/lib/permissions'
import { canonicalRoleCode, ROLE_CODES } from '@/lib/roleCodes'
import { useHasPermission } from '@/stores/authStore'
import type { Compte, CompteStatut } from '@/types'
import { CompteFormDialog } from './CompteFormDialog'
import { listCompteRoles } from './api'
import { useComptes, useCreateCompte, useDeleteCompte, useUpdateCompte } from './hooks'
import { toCompteCreate, toCompteUpdate, type CompteFormValues } from './schema'
import { statutCompteBadgeClass, statutCompteLabels } from './statut'

const PAGE_SIZE = 20

function departmentAssignmentKind(fonction?: string): 'chef' | 'superviseur' | null {
  const normalized = (fonction ?? '').trim().toLowerCase()
  if (normalized.includes('superviseur')) return 'superviseur'
  if (normalized.includes('chef') || normalized.includes('adjoint')) return 'chef'
  return null
}

export function ComptesPage() {
  const [searchInput, setSearchInput] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCompte, setEditingCompte] = useState<Compte | null>(null)
  const [compteToDelete, setCompteToDelete] = useState<Compte | null>(null)
  const [scopeSaveError, setScopeSaveError] = useState<string | null>(null)
  const [savingScopes, setSavingScopes] = useState(false)

  const canCreate = useHasPermission(PERMISSIONS.COMPTES_CREATE)
  const canUpdate = useHasPermission(PERMISSIONS.COMPTES_UPDATE)
  const canDelete = useHasPermission(PERMISSIONS.COMPTES_DELETE)
  const canReadPersonnes = useHasPermission(PERMISSIONS.MEMBRES_READ)
  const canManageRoles = useHasPermission(PERMISSIONS.ROLES_MANAGE)

  const listParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      q: submittedSearch || undefined,
      statut: (statutFilter || undefined) as CompteStatut | undefined,
    }),
    [page, submittedSearch, statutFilter],
  )
  const comptesQuery = useComptes(listParams)
  const personnesQuery = usePersonnes({ page: 1, limit: 100 }, canReadPersonnes)
  const rolesQuery = useRoles({ page: 1, limit: 100 }, canManageRoles && (canCreate || canUpdate))
  const createMutation = useCreateCompte()
  const updateMutation = useUpdateCompte()
  const deleteMutation = useDeleteCompte()
  const assignDepartmentMutation = useAssignPersonneDepartement()
  const unassignDepartmentMutation = useUnassignPersonneDepartement()

  const comptes = comptesQuery.data?.data ?? []
  const pagination = comptesQuery.data?.pagination
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1

  const personnes = personnesQuery.data?.data ?? []
  const personneNames = new Map(
    personnes.map((personne) => [personne.idPersonne, `${personne.prenom} ${personne.nom}`]),
  )
  // Une personne ne peut porter qu'un compte : on masque celles déjà servies.
  const idsDejaLiees = new Set(comptes.map((compte) => compte.idPersonne))
  const personnesDisponibles = personnes.filter(
    (personne) => !idsDejaLiees.has(personne.idPersonne),
  )
  const roles = rolesQuery.data?.data ?? []

  const openCreate = () => {
    setEditingCompte(null)
    setScopeSaveError(null)
    createMutation.reset()
    updateMutation.reset()
    setFormOpen(true)
  }

  const openEdit = (compte: Compte) => {
    setEditingCompte(compte)
    setScopeSaveError(null)
    createMutation.reset()
    updateMutation.reset()
    setFormOpen(true)
  }

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setPage(1)
    setSubmittedSearch(searchInput.trim())
  }

  const handleFormSubmit = async (values: CompteFormValues) => {
    setScopeSaveError(null)
    setSavingScopes(true)

    const rolesById = new Map(roles.map((role) => [role.idRole, role]))
    const selectedCodes = new Set(
      values.idRoles
        .map((roleId) => {
          const role = rolesById.get(roleId)
          return role ? canonicalRoleCode(role) : undefined
        })
        .filter((code): code is string => Boolean(code)),
    )
    let previousCodes = new Set<string>()
    let savedCompte: Compte

    try {
      if (editingCompte) {
        const previousAssignments = (await listCompteRoles(editingCompte.idCompte)).filter(
          (assignment) => assignment.actif,
        )
        previousCodes = new Set(
          previousAssignments
            .map((assignment) => {
              const role = rolesById.get(assignment.idRole)
              return role ? canonicalRoleCode(role) : undefined
            })
            .filter((code): code is string => Boolean(code)),
        )
      }

      savedCompte = editingCompte
        ? await updateMutation.mutateAsync({
            compteId: editingCompte.idCompte,
            payload: toCompteUpdate(values),
            idRoles: values.idRoles,
          })
        : await createMutation.mutateAsync({ payload: toCompteCreate(values), idRoles: values.idRoles })
    } catch (error) {
      if (editingCompte && !updateMutation.error) {
        setScopeSaveError(error instanceof Error ? error.message : 'Impossible de charger les rôles actuels.')
      }
      setSavingScopes(false)
      return
    }

    const personneId = editingCompte?.idPersonne ?? values.idPersonne
    const desiredFunctions = new Map<string, 'Chef' | 'Superviseur'>()
    if (selectedCodes.has(ROLE_CODES.CHEF_DEPARTEMENT)) {
      values.roleDepartments.chefDepartement.forEach((id) => desiredFunctions.set(id, 'Chef'))
    }
    if (selectedCodes.has(ROLE_CODES.SUPERVISEUR)) {
      values.roleDepartments.superviseur.forEach((id) => desiredFunctions.set(id, 'Superviseur'))
    }
    const managesDepartmentScope = [ROLE_CODES.CHEF_DEPARTEMENT, ROLE_CODES.SUPERVISEUR].some(
      (code) => selectedCodes.has(code) || previousCodes.has(code),
    )

    try {
      const currentAssignments = (await listPersonneDepartements(personneId)).filter(
        (assignment) => assignment.actif,
      )
      const toRemove = new Set<string>()

      for (const assignment of currentAssignments) {
        const kind = departmentAssignmentKind(assignment.fonction)
        const desired = desiredFunctions.get(assignment.idDepartement)
        if (desired && desired !== assignment.fonction) toRemove.add(assignment.idDepartement)
        if (managesDepartmentScope && kind && !desired) toRemove.add(assignment.idDepartement)
      }

      for (const departementId of toRemove) {
        await unassignDepartmentMutation.mutateAsync({ personneId, departementId })
      }

      const stillActive = new Map(
        currentAssignments
          .filter((assignment) => !toRemove.has(assignment.idDepartement))
          .map((assignment) => [assignment.idDepartement, assignment]),
      )
      for (const [departementId, fonction] of desiredFunctions) {
        if (stillActive.get(departementId)?.fonction === fonction) continue
        await assignDepartmentMutation.mutateAsync({
          personneId,
          payload: { idDepartement: departementId, fonction },
        })
      }
    } catch (error) {
      if (!editingCompte) {
        setEditingCompte(savedCompte)
        createMutation.reset()
      }
      setScopeSaveError(
        `Le compte est enregistré, mais l’affectation des départements a échoué : ${error instanceof Error ? error.message : 'erreur inconnue'}. Vérifiez les affectations de la personne avant de réessayer.`,
      )
      setSavingScopes(false)
      return
    }

    setSavingScopes(false)
    setFormOpen(false)
  }

  const formError =
    scopeSaveError ?? (editingCompte ? updateMutation.error?.message : createMutation.error?.message)
  const isSubmitting = createMutation.isPending || updateMutation.isPending || savingScopes

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Comptes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Accès de connexion rattachés aux personnes, avec leurs rôles.
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Nouveau compte
          </Button>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row" role="search">
        <div className="relative max-w-sm flex-1">
          <Search
            className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Rechercher une adresse e-mail…"
            aria-label="Rechercher un compte"
            className="pl-9"
          />
        </div>
        <Select
          value={statutFilter}
          onChange={(event) => {
            setPage(1)
            setStatutFilter(event.target.value)
          }}
          aria-label="Filtrer par statut"
          className="max-w-xs"
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="suspendu">Suspendu</option>
          <option value="desactive">Désactivé</option>
        </Select>
        <Button type="submit" variant="secondary">
          Rechercher
        </Button>
      </form>

      {comptesQuery.isError && (
        <Alert variant="error" title="Impossible de charger les comptes">
          {comptesQuery.error.message}
        </Alert>
      )}

      {comptesQuery.isLoading && <ChargementCentre label="Chargement des comptes…" />}

      {comptesQuery.isSuccess && comptes.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-slate-900">Aucun compte</p>
          <p className="mt-1 text-sm text-slate-500">
            {submittedSearch || statutFilter
              ? 'Aucun résultat pour ces critères.'
              : "Aucun compte de connexion n'est encore ouvert."}
          </p>
        </div>
      )}

      {comptes.length > 0 && (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Adresse e-mail</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Personne</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  {(canUpdate || canDelete) && (
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {comptes.map((compte) => {
                  const personneName = personneNames.get(compte.idPersonne)
                  return (
                    <tr key={compte.idCompte} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          to={`/comptes/${compte.idCompte}`}
                          className="font-medium text-brand-700 hover:text-brand-800"
                        >
                          {compte.email}
                        </Link>
                        <p className="text-xs text-slate-500 sm:hidden">{personneName ?? '—'}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                        {personneName ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statutCompteBadgeClass(compte.statut)}`}
                        >
                          {statutCompteLabels[compte.statut]}
                        </span>
                      </td>
                      {(canUpdate || canDelete) && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            {canUpdate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(compte)}
                                aria-label={`Modifier ${compte.email}`}
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
                                  setCompteToDelete(compte)
                                }}
                                aria-label={`Supprimer ${compte.email}`}
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
                {pagination.total} compte{pagination.total > 1 ? 's' : ''} · page {pagination.page} /{' '}
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

      <CompteFormDialog
        open={formOpen}
        compte={editingCompte}
        personnes={editingCompte ? personnes : personnesDisponibles}
        roles={rolesQuery.data?.data ?? []}
        rolesError={rolesQuery.error?.message}
        errorMessage={formError}
        isSubmitting={isSubmitting}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
      />

      <Dialog open={Boolean(compteToDelete)} onOpenChange={(open) => !open && setCompteToDelete(null)}>
        <DialogContent
          title="Supprimer ce compte ?"
          description="Le contrat interdit la suppression tant que le compte est actif."
        >
          {deleteMutation.isError && (
            <Alert variant="error" title="Suppression impossible">
              {deleteMutation.error.message}
            </Alert>
          )}
          <p className="text-sm text-slate-600">
            {compteToDelete?.email} perdra définitivement son accès. La personne rattachée est
            conservée.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCompteToDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => {
                if (!compteToDelete) return
                deleteMutation.mutate(compteToDelete.idCompte, {
                  onSuccess: () => setCompteToDelete(null),
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
