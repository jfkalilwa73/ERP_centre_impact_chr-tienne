import { useMemo, useState, type FormEvent } from 'react'
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { ChargementCentre } from '@/components/ui/Chargement'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PERMISSIONS } from '@/lib/permissions'
import { useHasPermission } from '@/stores/authStore'
import type { Permission } from '@/types'
import { PermissionAccesDialog } from './PermissionAccesDialog'
import { PermissionFormDialog } from './PermissionFormDialog'
import { UnitPageAccessManager } from './UnitPageAccessManager'
import {
  useCreatePermission,
  useDeletePermission,
  usePermissions,
  useUpdatePermission,
} from './hooks'
import { actionLabel, moduleLabel, permissionLabel } from './labels'
import { toPermissionCreate, toPermissionUpdate, type PermissionFormValues } from './schema'

const PAGE_SIZE = 20
const PAGE_SECTIONS = [
  { id: 'liste', label: 'Liste' },
  { id: 'acces-unite', label: 'Accès pages' },
] as const

export function PermissionsPage() {
  const [section, setSection] = useState<(typeof PAGE_SECTIONS)[number]['id']>('liste')
  const [searchInput, setSearchInput] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null)
  const [permissionAcces, setPermissionAcces] = useState<Permission | null>(null)

  const canManage = useHasPermission(PERMISSIONS.ROLES_MANAGE)
  const canReadCatalog = useHasPermission(PERMISSIONS.ROLES_READ)
  const canRead = canManage || canReadCatalog
  const activeSection = canManage ? section : 'liste'

  const catalogQuery = usePermissions({ page: 1, limit: 100 }, canRead)
  const modules = useMemo(() => {
    const unique = new Set((catalogQuery.data?.data ?? []).map((item) => item.module))
    return [...unique].sort((left, right) => moduleLabel(left).localeCompare(moduleLabel(right), 'fr'))
  }, [catalogQuery.data?.data])

  const listParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      q: submittedSearch || undefined,
      module: moduleFilter || undefined,
    }),
    [moduleFilter, page, submittedSearch],
  )
  const permissionsQuery = usePermissions(listParams)
  const createMutation = useCreatePermission()
  const updateMutation = useUpdatePermission()
  const deleteMutation = useDeletePermission()

  const permissions = permissionsQuery.data?.data ?? []
  const pagination = permissionsQuery.data?.pagination
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1

  const openCreate = () => {
    setEditingPermission(null)
    createMutation.reset()
    updateMutation.reset()
    setFormOpen(true)
  }

  const openEdit = (permission: Permission) => {
    setEditingPermission(permission)
    createMutation.reset()
    updateMutation.reset()
    setFormOpen(true)
  }

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setPage(1)
    setSubmittedSearch(searchInput.trim())
  }

  const handleFormSubmit = (values: PermissionFormValues) => {
    if (editingPermission) {
      updateMutation.mutate(
        { permissionId: editingPermission.idPermission, payload: toPermissionUpdate(values) },
        { onSuccess: () => setFormOpen(false) },
      )
      return
    }

    createMutation.mutate(toPermissionCreate(values), {
      onSuccess: () => setFormOpen(false),
    })
  }

  const formError = editingPermission
    ? updateMutation.error?.message
    : createMutation.error?.message
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Permissions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ce que chaque personne a le droit de faire. L’œil montre qui a ce droit, pour l’ouvrir ou le
            retirer.
          </p>
        </div>
        {canManage && activeSection === 'liste' && (
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Nouvelle permission
          </Button>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Sections des permissions"
        className="flex flex-wrap gap-6 border-b border-slate-200"
      >
        {(canManage ? PAGE_SECTIONS : PAGE_SECTIONS.slice(0, 1)).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={activeSection === item.id}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium ${
              activeSection === item.id
                ? 'border-gerbe-or text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeSection === 'acces-unite' ? (
        canManage && <UnitPageAccessManager />
      ) : (
        <>
      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search
            className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Rechercher un droit, une rubrique…"
            aria-label="Rechercher une permission"
            className="pl-9"
          />
        </div>
        <Select
          value={moduleFilter}
          onChange={(event) => {
            setPage(1)
            setModuleFilter(event.target.value)
          }}
          aria-label="Filtrer par rubrique"
          className="sm:w-56"
        >
          <option value="">Toutes les rubriques</option>
          {modules.map((module) => (
            <option key={module} value={module}>
              {moduleLabel(module)}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          Rechercher
        </Button>
      </form>

      {permissionsQuery.isError && (
        <Alert variant="error" title="Impossible de charger les permissions">
          {permissionsQuery.error.message}
        </Alert>
      )}

      {permissionsQuery.isLoading && <ChargementCentre label="Chargement des permissions…" />}

      {permissionsQuery.isSuccess && permissions.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-slate-900">Aucune permission</p>
          <p className="mt-1 text-sm text-slate-500">
            {submittedSearch || moduleFilter
              ? 'Aucun résultat pour ces critères.'
              : "Aucune permission n'est encore enregistrée."}
          </p>
        </div>
      )}

      {permissions.length > 0 && (
        <>
          <p className="text-xs text-slate-500 sm:hidden">
            Faites glisser le tableau horizontalement pour voir toutes les colonnes.
          </p>
          <div
            className="overflow-x-auto overscroll-x-contain rounded-xl border border-slate-200 bg-white"
            role="region"
            aria-label="Liste des permissions, défilement horizontal possible"
            tabIndex={0}
          >
            <table className="w-full min-w-[38rem] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Droit</th>
                  <th className="px-4 py-3 font-medium">Rubrique</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Ce qu’on peut faire</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  {canManage && <th className="px-4 py-3 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {permissions.map((permission) => (
                  <tr
                    key={permission.idPermission}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{permissionLabel(permission)}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{moduleLabel(permission.module)}</td>
                    <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                      {actionLabel(permission.action)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          permission.actif
                            ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'
                            : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
                        }
                      >
                        {permission.actif ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPermissionAcces(permission)}
                            aria-label={`Voir les accès de ${permissionLabel(permission)}`}
                          >
                            <Eye className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(permission)}
                            aria-label={`Modifier ${permissionLabel(permission)}`}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              deleteMutation.reset()
                              setPermissionToDelete(permission)
                            }}
                            aria-label={`Supprimer ${permissionLabel(permission)}`}
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
                {pagination.total} permission{pagination.total > 1 ? 's' : ''} · page{' '}
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

      <PermissionAccesDialog
        permission={permissionAcces}
        open={Boolean(permissionAcces)}
        onOpenChange={(next) => {
          if (!next) setPermissionAcces(null)
        }}
      />

      <PermissionFormDialog
        open={formOpen}
        permission={editingPermission}
        errorMessage={formError}
        isSubmitting={isSubmitting}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
      />

      <Dialog
        open={Boolean(permissionToDelete)}
        onOpenChange={(open) => !open && setPermissionToDelete(null)}
      >
        <DialogContent
          title="Supprimer cette permission ?"
          description="Le contrat n'autorise la suppression que si aucun rôle ne l'utilise encore."
        >
          {deleteMutation.isError && (
            <Alert variant="error" title="Suppression impossible">
              {deleteMutation.error.message}
            </Alert>
          )}
          <p className="text-sm text-slate-600">
            {permissionToDelete ? permissionLabel(permissionToDelete) : 'Ce droit'} sera retiré
            définitivement.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPermissionToDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => {
                if (!permissionToDelete) return
                deleteMutation.mutate(permissionToDelete.idPermission, {
                  onSuccess: () => setPermissionToDelete(null),
                })
              }}
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  )
}
