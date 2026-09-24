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
import { usePersonne } from '@/features/personnes/hooks'
import { useRoles } from '@/features/roles/hooks'
import { errorId } from '@/lib/form'
import { PERMISSIONS } from '@/lib/permissions'
import { useHasPermission } from '@/stores/authStore'
import { useAssignRole, useCompte, useCompteRoles, useUnassignRole } from './hooks'
import { affectationRoleSchema, type AffectationRoleFormValues } from './schema'
import { statutCompteBadgeClass, statutCompteLabels } from './statut'

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  )
}

export function CompteDetailPage() {
  const { compteId } = useParams<{ compteId: string }>()
  const [assignOpen, setAssignOpen] = useState(false)

  const canManageRoles = useHasPermission(PERMISSIONS.ROLES_MANAGE)
  const canReadPersonnes = useHasPermission(PERMISSIONS.MEMBRES_READ)

  const compteQuery = useCompte(compteId)
  const affectationsQuery = useCompteRoles(compteId)
  const rolesQuery = useRoles({ page: 1, limit: 100 }, canManageRoles)
  const assignMutation = useAssignRole(compteId ?? '')
  const unassignMutation = useUnassignRole(compteId ?? '')

  const compte = compteQuery.data
  const personneQuery = usePersonne(canReadPersonnes ? compte?.idPersonne : undefined)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AffectationRoleFormValues>({
    resolver: zodResolver(affectationRoleSchema),
    defaultValues: { idRole: '' },
  })

  const affectations = affectationsQuery.data ?? []
  const roles = rolesQuery.data?.data ?? []
  const roleNames = new Map(roles.map((role) => [role.idRole, `${role.nom} (${role.code})`]))
  const rolesDejaActifs = new Set(
    affectations.filter((affectation) => affectation.actif).map((affectation) => affectation.idRole),
  )
  const rolesDisponibles = roles.filter(
    (role) => role.actif && !rolesDejaActifs.has(role.idRole),
  )

  const onAssign = handleSubmit((values) => {
    assignMutation.mutate(
      { idRole: values.idRole },
      {
        onSuccess: () => {
          setAssignOpen(false)
          reset({ idRole: '' })
        },
      },
    )
  })

  if (compteQuery.isLoading) {
    return <p className="text-sm text-slate-500">Chargement du compte…</p>
  }

  if (compteQuery.isError || !compte) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="error" title="Compte introuvable">
          {compteQuery.error?.message ?? 'Ce compte n’existe pas.'}
        </Alert>
        <Link to="/comptes" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          Retour aux comptes
        </Link>
      </div>
    )
  }

  const personne = personneQuery.data

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/comptes"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Comptes
        </Link>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{compte.email}</h1>
            <p className="mt-1 text-sm text-slate-500">Accès de connexion et rôles attribués.</p>
          </div>
          <span
            className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${statutCompteBadgeClass(compte.statut)}`}
          >
            {statutCompteLabels[compte.statut]}
          </span>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Informations</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">Personne rattachée</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {personne ? (
                <Link
                  to={`/personnes/${personne.idPersonne}`}
                  className="font-medium text-brand-700 hover:text-brand-800"
                >
                  {personne.prenom} {personne.nom}
                </Link>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">
              Double authentification
            </dt>
            <dd className="mt-1 text-sm text-slate-900">
              {compte.mfaActive ? 'Activée' : 'Désactivée'}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">Dernière connexion</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {compte.derniereConnexion ? formatDateTime(compte.derniereConnexion) : 'Jamais'}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate-500 uppercase">Création</dt>
            <dd className="mt-1 text-sm text-slate-900">{formatDateTime(compte.dateCreation)}</dd>
          </div>
          {compte.dateDesactivation && (
            <div>
              <dt className="text-xs tracking-wide text-slate-500 uppercase">Désactivation</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {formatDateTime(compte.dateDesactivation)}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Rôles</h2>
          {canManageRoles && (
            <Button
              size="sm"
              onClick={() => {
                assignMutation.reset()
                setAssignOpen(true)
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Attribuer un rôle
            </Button>
          )}
        </div>

        {affectationsQuery.isError && (
          <Alert variant="error" title="Impossible de charger les rôles">
            {affectationsQuery.error.message}
          </Alert>
        )}

        {affectationsQuery.isSuccess && affectations.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
            Aucun rôle attribué : ce compte ne peut rien faire dans l'application.
          </p>
        )}

        {affectations.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Rôle</th>
                  <th className="px-4 py-3 font-medium">Période</th>
                  {canManageRoles && <th className="px-4 py-3 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {affectations.map((affectation) => (
                  <tr
                    key={`${affectation.idRole}-${affectation.dateDebut}`}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {roleNames.get(affectation.idRole) ??
                        (canManageRoles ? 'Rôle' : affectation.idRole.slice(0, 8))}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateTime(affectation.dateDebut)}
                      {affectation.dateFin
                        ? ` → ${formatDateTime(affectation.dateFin)}`
                        : ' → en cours'}
                    </td>
                    {canManageRoles && (
                      <td className="px-4 py-3 text-right">
                        {affectation.actif ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            isLoading={
                              unassignMutation.isPending &&
                              unassignMutation.variables === affectation.idRole
                            }
                            onClick={() => unassignMutation.mutate(affectation.idRole)}
                          >
                            Retirer
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">Clôturé</span>
                        )}
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
          title="Attribuer un rôle"
          description="Le changement est audité. Un rôle retiré reste visible dans l'historique."
        >
          <form onSubmit={onAssign} noValidate className="flex flex-col gap-4">
            {assignMutation.isError && (
              <Alert variant="error" title="Attribution impossible">
                {assignMutation.error.message}
              </Alert>
            )}
            <FormField id="affectation-role" label="Rôle" error={errors.idRole?.message}>
              <Select
                id="affectation-role"
                hasError={Boolean(errors.idRole)}
                aria-describedby={errors.idRole ? errorId('affectation-role') : undefined}
                {...register('idRole')}
              >
                <option value="">Choisir un rôle</option>
                {rolesDisponibles.map((role) => (
                  <option key={role.idRole} value={role.idRole}>
                    {role.nom} ({role.code})
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setAssignOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" isLoading={assignMutation.isPending}>
                Enregistrer le rôle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
