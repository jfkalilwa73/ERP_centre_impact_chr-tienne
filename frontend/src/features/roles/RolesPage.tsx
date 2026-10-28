import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { ChargementCentre } from '@/components/ui/Chargement'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { PERMISSIONS } from '@/lib/permissions'
import { useHasPermission } from '@/stores/authStore'
import type { Role } from '@/types'
import { RoleFormDialog } from './RoleFormDialog'
import {
  useCreateRole,
  useDeleteRole,
  useInstallDefaultRoles,
  useRoles,
  useUpdateRole,
} from './hooks'
import { toRoleCreate, toRoleUpdate, type RoleFormValues } from './schema'

const PAGE_SIZE = 20

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
}

export function RolesPage() {
  const [searchInput, setSearchInput] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

  const canManage = useHasPermission(PERMISSIONS.ROLES_MANAGE)

  const listParams = useMemo(
    () => ({ page, limit: PAGE_SIZE, q: submittedSearch || undefined }),
    [page, submittedSearch],
  )
  const rolesQuery = useRoles(listParams)
  const createMutation = useCreateRole()
  const updateMutation = useUpdateRole()
  const deleteMutation = useDeleteRole()
  const installDefaultsMutation = useInstallDefaultRoles()

  const roles = rolesQuery.data?.data ?? []
  const pagination = rolesQuery.data?.pagination
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1

  const openCreate = () => {
    setEditingRole(null)
    createMutation.reset()
    updateMutation.reset()
    setFormOpen(true)
  }

  const openEdit = (role: Role) => {
    setEditingRole(role)
    createMutation.reset()
    updateMutation.reset()
    setFormOpen(true)
  }

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setPage(1)
    setSubmittedSearch(searchInput.trim())
  }

  const handleFormSubmit = (values: RoleFormValues) => {
    if (editingRole) {
      updateMutation.mutate(
        { roleId: editingRole.idRole, payload: toRoleUpdate(values) },
        { onSuccess: () => setFormOpen(false) },
      )
      return
    }

    createMutation.mutate(toRoleCreate(values), {
      onSuccess: () => setFormOpen(false),
    })
  }

  const formError = editingRole ? updateMutation.error?.message : createMutation.error?.message
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Rôles</h1>
          <p className="mt-1 text-sm text-slate-500">
            Profils de droits attribués aux comptes.
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              isLoading={installDefaultsMutation.isPending}
              onClick={() => installDefaultsMutation.mutate()}
            >
              Installer les rôles prédéfinis
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              Nouveau rôle
            </Button>
          </div>
        )}
      </div>

      {installDefaultsMutation.isSuccess && (
        <Alert variant="success" title="Rôles prédéfinis prêts">
          {installDefaultsMutation.data.rolesCreated === 0 &&
          installDefaultsMutation.data.permissionsCreated === 0 &&
          installDefaultsMutation.data.rolePermissionsAdded === 0 ? (
            'Les rôles et leurs droits de base sont déjà présents.'
          ) : (
            <>
              {installDefaultsMutation.data.rolesCreated} rôle(s) créé(s),{' '}
              {installDefaultsMutation.data.rolesReused} rôle(s) existant(s) réutilisé(s),{' '}
              {installDefaultsMutation.data.permissionsCreated} permission(s) de catalogue créée(s) et{' '}
              {installDefaultsMutation.data.rolePermissionsAdded} droit(s) associé(s). Les droits
              déjà configurés et les droits personnalisés ont été conservés.
            </>
          )}
        </Alert>
      )}
      {installDefaultsMutation.isError && (
        <Alert variant="error" title="Installation des rôles impossible">
          {installDefaultsMutation.error.message}
        </Alert>
      )}

      <form onSubmit={handleSearch} className="flex gap-2" role="search">
        <div className="relative max-w-sm flex-1">
          <Search
            className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Rechercher un rôle…"
            aria-label="Rechercher un rôle"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Rechercher
        </Button>
      </form>

      {rolesQuery.isError && (
        <Alert variant="error" title="Impossible de charger les rôles">
          {rolesQuery.error.message}
        </Alert>
      )}

      {rolesQuery.isLoading && <ChargementCentre label="Chargement des rôles…" />}

      {rolesQuery.isSuccess && roles.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-slate-900">Aucun rôle</p>
          <p className="mt-1 text-sm text-slate-500">
            {submittedSearch
              ? 'Aucun résultat pour cette recherche.'
              : "Aucun rôle n'est encore enregistré."}
          </p>
        </div>
      )}

      {roles.length > 0 && (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Niveau</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Créé le</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  {canManage && <th className="px-4 py-3 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.idRole} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{role.code}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/roles/${role.idRole}`}
                        className="font-medium text-brand-700 hover:text-brand-800"
                      >
                        {role.nom}
                      </Link>
                      {role.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                          {role.description}
                        </p>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                      {role.niveauConfidentialite ?? 1}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">
                      {formatDate(role.dateCreation)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          role.actif
                            ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'
                            : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
                        }
                      >
                        {role.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(role)}
                            aria-label={`Modifier ${role.nom}`}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              deleteMutation.reset()
                              setRoleToDelete(role)
                            }}
                            aria-label={`Supprimer ${role.nom}`}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.total > PAGE_SIZE && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <p>
                {pagination.total} rôle{pagination.total > 1 ? 's' : ''} · page {pagination.page} /{' '}
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

      <RoleFormDialog
        open={formOpen}
        role={editingRole}
        errorMessage={formError}
        isSubmitting={isSubmitting}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
      />

      <Dialog open={Boolean(roleToDelete)} onOpenChange={(open) => !open && setRoleToDelete(null)}>
        <DialogContent
          title="Supprimer ce rôle ?"
          description="Le contrat n'autorise la suppression que si aucun compte n'y est encore rattaché."
        >
          {deleteMutation.isError && (
            <Alert variant="error" title="Suppression impossible">
              {deleteMutation.error.message}
            </Alert>
          )}
          <p className="text-sm text-slate-600">
            {roleToDelete?.nom} ({roleToDelete?.code}) sera retiré définitivement.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRoleToDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => {
                if (!roleToDelete) return
                deleteMutation.mutate(roleToDelete.idRole, {
                  onSuccess: () => setRoleToDelete(null),
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
