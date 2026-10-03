import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Plus } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { usePermissions } from '@/features/permissions/hooks'
import { actionLabel, moduleLabel, permissionLabel } from '@/features/permissions/labels'
import { PERMISSIONS } from '@/lib/permissions'
import { errorId } from '@/lib/form'
import { useHasPermission } from '@/stores/authStore'
import { useAssignPermission, useRole, useRolePermissions, useUnassignPermission } from './hooks'
import { rolePermissionSchema, type RolePermissionFormValues } from './schema'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
}

export function RoleDetailPage() {
  const { roleId } = useParams<{ roleId: string }>()
  const [assignOpen, setAssignOpen] = useState(false)

  const canManage = useHasPermission(PERMISSIONS.ROLES_MANAGE)

  const roleQuery = useRole(roleId)
  const assignedQuery = useRolePermissions(roleId)
  const catalogQuery = usePermissions({ page: 1, limit: 100 }, canManage)
  const assignMutation = useAssignPermission(roleId ?? '')
  const unassignMutation = useUnassignPermission(roleId ?? '')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RolePermissionFormValues>({
    resolver: zodResolver(rolePermissionSchema),
    defaultValues: { idPermission: '' },
  })

  const role = roleQuery.data
  const assigned = assignedQuery.data ?? []
  const catalog = catalogQuery.data?.data ?? []
  const assignedIds = new Set(assigned.map((permission) => permission.idPermission))
  const available = catalog.filter((permission) => !assignedIds.has(permission.idPermission))

  const onAssign = handleSubmit((values) => {
    assignMutation.mutate(
      { idPermission: values.idPermission },
      {
        onSuccess: () => {
          setAssignOpen(false)
          reset({ idPermission: '' })
        },
      },
    )
  })

  if (roleQuery.isLoading) {
    return <p className="text-sm text-slate-500">Chargement du rôle…</p>
  }

  if (roleQuery.isError || !role) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="error" title="Rôle introuvable">
          {roleQuery.error?.message ?? "Ce rôle n'existe pas."}
        </Alert>
        <Link to="/roles" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          Retour aux rôles
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/roles"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Rôles
        </Link>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{role.nom}</h1>
            <p className="mt-1 font-mono text-sm text-slate-500">{role.code}</p>
          </div>
          <span
            className={
              role.actif
                ? 'w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700'
                : 'w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500'
            }
          >
            {role.actif ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Informations</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">Description</dt>
            <dd className="mt-1 text-sm text-slate-900">{role.description ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">
              Niveau de confidentialité
            </dt>
            <dd className="mt-1 text-sm text-slate-900">{role.niveauConfidentialite ?? 1}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">Création</dt>
            <dd className="mt-1 text-sm text-slate-900">{formatDate(role.dateCreation)}</dd>
          </div>
        </dl>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Droits de ce rôle</h2>
          {canManage && (
            <Button
              size="sm"
              onClick={() => {
                assignMutation.reset()
                setAssignOpen(true)
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Attribuer un droit
            </Button>
          )}
        </div>

        {assignedQuery.isError && (
          <Alert variant="error" title="Impossible de charger les permissions">
            {assignedQuery.error.message}
          </Alert>
        )}

        {assignedQuery.isSuccess && assigned.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
            Aucun droit attribué : ce rôle n’ouvre encore rien.
          </p>
        )}

        {assigned.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Droit</th>
                  <th className="px-4 py-3 font-medium">Rubrique</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Ce qu’on peut faire</th>
                  {canManage && <th className="px-4 py-3 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {assigned.map((permission) => (
                  <tr key={permission.idPermission} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{permissionLabel(permission)}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{moduleLabel(permission.module)}</td>
                    <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                      {actionLabel(permission.action)}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          isLoading={
                            unassignMutation.isPending &&
                            unassignMutation.variables === permission.idPermission
                          }
                          onClick={() => unassignMutation.mutate(permission.idPermission)}
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
      </section>

      <Dialog
        open={assignOpen}
        onOpenChange={(open) => {
          setAssignOpen(open)
          if (!open) assignMutation.reset()
        }}
      >
        <DialogContent
          title="Attribuer un droit"
          description="Le changement est audité. Un droit retiré n’apparaît plus sur ce rôle."
        >
          <form onSubmit={onAssign} noValidate className="flex flex-col gap-4">
            {assignMutation.isError && (
              <Alert variant="error" title="Attribution impossible">
                {assignMutation.error.message}
              </Alert>
            )}
            <FormField
              id="role-permission"
              label="Droit"
              error={errors.idPermission?.message}
            >
              <Select
                id="role-permission"
                hasError={Boolean(errors.idPermission)}
                aria-describedby={errors.idPermission ? errorId('role-permission') : undefined}
                {...register('idPermission')}
              >
                <option value="">Choisir un droit</option>
                {available.map((permission) => (
                  <option key={permission.idPermission} value={permission.idPermission}>
                    {permissionLabel(permission)}
                    {` (${moduleLabel(permission.module)})`}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setAssignOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" isLoading={assignMutation.isPending}>
                Enregistrer le droit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
